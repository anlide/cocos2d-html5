/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/**
 * TextureCache - Alloc, Init & Dealloc
 * @type {object}
 */
cc.g_sharedTextureCache = null;

/**
 * Load the images to the cache
 * @param imageUrl
 */
cc.loadImage = function (imageUrl) {
    // compute image type
    var imageType = cc.computeImageFormatType(imageUrl);
    if (imageType == cc.FMT_UNKNOWN) {
        cc.Log("unsupported format" + imageUrl);
        return;
    }
    var image = new Image();
    image.src = imageUrl;
    image.onLoad = function (e) {
        cc.TextureCache.sharedTextureCache().cacheImage(imageUrl, image);
    };
};

/**
 *  Support image format type
 * @param filename
 * @return {Number}
 */
cc.computeImageFormatType = function (filename) {
    if (filename.toLowerCase().indexOf('.jpg') > 0 || filename.toLowerCase().indexOf('.jpeg') > 0) {
        return cc.FMT_JPG;
    } else if (filename.indexOf('.png') > 0 || filename.indexOf('.PNG') > 0) {
        return cc.FMT_PNG;
    }
    return cc.FMT_UNKNOWN;
};

/**
 *  Implementation TextureCache
 * @class
 * @extends cc.TextureCache
 */
cc.TextureCache = cc.Class.extend(/** @lends cc.TextureCache# */{
    textures:{},
    _textureColorsCache:{},
    /**
     * @Constructor
     */
    ctor:function () {
        cc.Assert(cc.g_sharedTextureCache == null, "Attempted to allocate a second instance of a singleton.");
    },
    /**
     *  Loading the images asynchronously
     * @param {String} path
     * @param {cc.Node} target
     * @param {Function} selector
     * @return {Image}
     * @example
     * //example
     * cc.TextureCache.sharedTextureCache().addImageAsync("hello.png", this, this.loadingCallBack);
     */
    addImageAsync:function (path, target, selector) {
        cc.Assert(path != null, "TextureCache: path MUST not be null");
        var texture = this.textures[path.toString()];

        if (texture) {
            this._addImageAsyncCallBack(target, selector);
        }
        else {
            texture = new Image();
            var that = this;
            texture.addEventListener("load", function () {
                that._addImageAsyncCallBack(target, selector);
            });
            texture.src = path;
            this.textures[path.toString()] = texture;
        }

        if (cc.renderContextType == cc.CANVAS) {
            return this.textures[path.toString()];
        } else {
            //todo texure for gl
        }
    },
    _addImageAsyncCallBack:function (target, selector) {
        if (target && (typeof(selector) == "string")) {
            target[selector]();
        } else if (target && (typeof(selector) == "function")) {
            selector.call(target);
        }
    },
    /**
     * AddPVRTCImage does not support
     */
    addPVRTCImage:function () {
        cc.Assert(0, "TextureCache:addPVRTCImage does not support");
    },
    /**
     * Description
     * @return {String}
     */
    description:function () {
        return "<TextureCache | Number of textures = " + this.textures.length + ">";
    },

    /**
     * Returns a Texture2D object given an file image
     * If the file image was not previously loaded, it will create a new Texture2D
     *  object and it will return it. It will use the filename as a key.
     * Otherwise it will return a reference of a previously loaded image.
     * Supported image extensions: .png, .jpg, .gif
     * @param {String} path
     * @return {Image}
     * @example
     * //example
     * cc.TextureCache.sharedTextureCache().addImage("hello.png");
     */
    addImage:function (path) {
        cc.Assert(path != null, "TextureCache: path MUST not be null");
        var texture = this.textures[path.toString()];
        if (texture) {
            cc.Loader.shareLoader().onResLoaded();
        }
        else {
            texture = new Image();
            var that = this;
            texture.addEventListener("load", function () {

                cc.Loader.shareLoader().onResLoaded();
            });
            texture.addEventListener("error", function () {
                cc.Loader.shareLoader().onResLoadingErr(path);
            });
            texture.src = path;
            this.textures[path.toString()] = texture;
        }

        if (cc.renderContextType == cc.CANVAS) {
            return this.textures[path.toString()];
        } else {
            //todo texture for gl
        }
    },
    /**
     *  Cache the image data
     * @param {String} path
     * @param {Image} texture
     */
    cacheImage:function (path, texture) {
        if (!this.textures[path.toString()]) {
            this.textures[path.toString()] = texture;
        }
    },
    /** Returns a Texture2D object given an UIImage image
     * If the image was not previously loaded, it will create a new Texture2D object and it will return it.
     * Otherwise it will return a reference of a previously loaded image
     * The "key" parameter will be used as the "key" for the cache.
     * If "key" is null, then a new texture will be created each time.
     * @param {Image} image
     * @param {String} key
     * @return {cc.Texture2D}
     */
    addUIImage:function (image, key) {
        cc.Assert(image != null, "TextureCache: image MUST not be nulll");

        var texture = null;

        if (key) {
            if (this.textures.hasOwnProperty(key)) {
                texture = this.textures[key];
                if (texture) {
                    return texture;
                }
            }
        }

        // prevents overloading the autorelease pool
        texture = new cc.Texture2D();
        texture.initWithImage(image);

        if ((key != null) && (texture != null)) {
            this.textures[key] = texture;
        } else {
            cc.Log("cocos2d: Couldn't add UIImage in TextureCache");
        }

        return texture;
    },

    /**
     * Returns an already created texture. Returns null if the texture doesn't exist.
     * @param {String} key
     * @return {Image|Null}
     * @example
     * //example
     * var key = cc.TextureCache.sharedTextureCache().textureForKey("hello.png");
     */
    textureForKey:function (key) {
        if (this.textures.hasOwnProperty(key)) {
            return this.textures[key];
        } else {
            return null;
        }
    },
    /**
     * @param {Image} texture
     * @return {String|Null}
     * @example
     * //example
     * var key = cc.TextureCache.sharedTextureCache().getKeyByTexture(texture);
     */
    getKeyByTexture:function (texture) {
        for (var key in this.textures) {
            if (this.textures[key] == texture) {
                return key;
            }
        }
        return null;
    },
    /**
     * @param {Image} texture
     * @return {Array}
     * @example
     * //example
     * var cacheTextureForColor = cc.TextureCache.sharedTextureCache().getTextureColors(texture);
     */
    getTextureColors:function (texture) {
        var key = this.getKeyByTexture(texture);
        if (key) {
            if (texture instanceof HTMLImageElement) {
                key = texture.src;
            } else {
                return null;
            }
        }

        if (!this._textureColorsCache.hasOwnProperty(key)) {
            this._textureColorsCache[key] = cc.generateTextureCacheForColor(texture);
        }
        return this._textureColorsCache[key];
    },

    /**
     * Purges the dictionary of loaded textures.
     * Call this method if you receive the "Memory Warning"
     * In the short term: it will free some resources preventing your app from being killed
     * In the medium term: it will allocate more resources
     * In the long term: it will be the same
     * @example
     * //example
     * cc.TextureCache.sharedTextureCache().removeAllTextures();
     */
    removeAllTextures:function () {
        this.textures = {};
    },

    /**
     * Deletes a texture from the cache given a texture
     * @param {Image} texture
     * @example
     * //example
     * cc.TextureCache.sharedTextureCache().removeTexture(texture);
     */
    removeTexture:function (texture) {
        if (!texture)
            return;

        for (var key in this.textures) {
            if (this.textures[key] == texture) {
                delete(this.textures[key]);
                return;
            }
        }
    },

    /**
     * Deletes a texture from the cache given a its key name
     * @param {String} textureKeyName
     * @example
     * //example
     * cc.TextureCache.sharedTextureCache().removeTexture("hello.png");
     */
    removeTextureForKey:function (textureKeyName) {
        if (textureKeyName == null) {
            return;
        }
        if (this.textures[textureKeyName]) {
            delete(this.textures[textureKeyName]);
        }
    },

    /**
     * Output to cc.Log the current contents of this TextureCache
     * This will attempt to calculate the size of each texture, and the total texture memory in use.
     */
    dumpCachedTextureInfo:function () {
        var count = 0;
        var totalBytes = 0;
        for (var key in this.textures) {
            var tex = this.textures[key];
            var bpp = tex.bitsPerPixelForFormat();
            // Each texture takes up width * height * bytesPerPixel bytes.
            var bytes = tex.getPixelsWide() * tex.getPixelsHigh() * bpp / 8;
            totalBytes += bytes;
            count++;
            cc.Log("cocos2d: '" + tex.toString() + "' id=" + tex.getName() + " " + tex.getPixelsWide() + " x " + tex.getPixelsHigh() + " @ " + bpp + " bpp => " + bytes / 1024 + " KB");
        }

        cc.Log("cocos2d: TextureCache dumpDebugInfo: " + count + " textures, for " + (totalBytes / 1024) + " KB (" + (totalBytes / (1024.0 * 1024.0)).toFixed(2) + " MB)");
    },

    /**
     * Returns a Texture2D object given an PVR filename
     * If the file image was not previously loaded, it will create a new Texture2D
     *  object and it will return it. Otherwise it will return a reference of a previously loaded image
     * @param {String} path
     * @return {cc.Texture2D}
     */
    addPVRImage:function (path) {
        cc.Assert(path != null, "TextureCache: file image MUST not be null");

        var key = path;

        if (this.textures[key] != null) {
            return this.textures[key];
        }

        // Split up directory and filename
        var tex = new cc.Texture2D();
        if (tex.initWithPVRFile(key)) {
            this.textures[key] = tex;
        } else {
            cc.Log("cocos2d: Couldn't add PVRImage:" + key + " in TextureCache");
        }

        return tex;
    }
});

/**
 * Return ths shared instance of the cache
 * @return {cc.TextureCache}
 */
cc.TextureCache.sharedTextureCache = function () {
    if (!cc.g_sharedTextureCache)
        cc.g_sharedTextureCache = new cc.TextureCache();
    return cc.g_sharedTextureCache;
};

/**
 * Purges the cache. It releases the retained instance.
 */
cc.TextureCache.purgeSharedTextureCache = function () {
    cc.g_sharedTextureCache = null;
};