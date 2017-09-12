// Generated by CoffeeScript 1.12.7

/*
paste.js is an interface to read data ( text / image ) from clipboard in different browsers. It also contains several hacks.

https://github.com/layerssss/paste.js
 */

(function() {
  var $, Paste, createHiddenEditable, dataURLtoBlob, isFocusable;

  $ = window.jQuery;

  $.paste = function(pasteContainer) {
    var pm;
    if (typeof console !== "undefined" && console !== null) {
      console.log("DEPRECATED: This method is deprecated. Please use $.fn.pastableNonInputable() instead.");
    }
    pm = Paste.mountNonInputable(pasteContainer);
    return pm._container;
  };

  $.fn.pastableNonInputable = function() {
    var el, j, len, ref;
    ref = this;
    for (j = 0, len = ref.length; j < len; j++) {
      el = ref[j];
      if (el._pastable || $(el).is('textarea, input:text, [contenteditable]')) {
        continue;
      }
      Paste.mountNonInputable(el);
      el._pastable = true;
    }
    return this;
  };

  $.fn.pastableTextarea = function() {
    var el, j, len, ref;
    ref = this;
    for (j = 0, len = ref.length; j < len; j++) {
      el = ref[j];
      if (el._pastable || $(el).is(':not(textarea, input:text)')) {
        continue;
      }
      Paste.mountTextarea(el);
      el._pastable = true;
    }
    return this;
  };

  $.fn.pastableContenteditable = function() {
    var el, j, len, ref;
    ref = this;
    for (j = 0, len = ref.length; j < len; j++) {
      el = ref[j];
      if (el._pastable || $(el).is(':not([contenteditable])')) {
        continue;
      }
      Paste.mountContenteditable(el);
      el._pastable = true;
    }
    return this;
  };

  dataURLtoBlob = function(dataURL, sliceSize) {
    var b64Data, byteArray, byteArrays, byteCharacters, byteNumbers, contentType, i, m, offset, ref, slice;
    if (sliceSize == null) {
      sliceSize = 512;
    }
    if (!(m = dataURL.match(/^data\:([^\;]+)\;base64\,(.+)$/))) {
      return null;
    }
    ref = m, m = ref[0], contentType = ref[1], b64Data = ref[2];
    byteCharacters = atob(b64Data);
    byteArrays = [];
    offset = 0;
    while (offset < byteCharacters.length) {
      slice = byteCharacters.slice(offset, offset + sliceSize);
      byteNumbers = new Array(slice.length);
      i = 0;
      while (i < slice.length) {
        byteNumbers[i] = slice.charCodeAt(i);
        i++;
      }
      byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
      offset += sliceSize;
    }
    return new Blob(byteArrays, {
      type: contentType
    });
  };

  createHiddenEditable = function() {
    return $(document.createElement('div')).attr('contenteditable', true).attr('aria-hidden', true).attr('tabindex', -1).css({
      width: 1,
      height: 1,
      position: 'fixed',
      left: -100,
      overflow: 'hidden'
    });
  };

  isFocusable = function(element, hasTabindex) {
    var fieldset, focusableIfVisible, img, map, mapName, nodeName;
    map = void 0;
    mapName = void 0;
    img = void 0;
    focusableIfVisible = void 0;
    fieldset = void 0;
    nodeName = element.nodeName.toLowerCase();
    if ('area' === nodeName) {
      map = element.parentNode;
      mapName = map.name;
      if (!element.href || !mapName || map.nodeName.toLowerCase() !== 'map') {
        return false;
      }
      img = $('img[usemap=\'#' + mapName + '\']');
      return img.length > 0 && img.is(':visible');
    }
    if (/^(input|select|textarea|button|object)$/.test(nodeName)) {
      focusableIfVisible = !element.disabled;
      if (focusableIfVisible) {
        fieldset = $(element).closest('fieldset')[0];
        if (fieldset) {
          focusableIfVisible = !fieldset.disabled;
        }
      }
    } else if ('a' === nodeName) {
      focusableIfVisible = element.href || hasTabindex;
    } else {
      focusableIfVisible = hasTabindex;
    }
    focusableIfVisible = focusableIfVisible || $(element).is('[contenteditable]');
    return focusableIfVisible && $(element).is(':visible');
  };

  Paste = (function() {
    Paste.prototype._target = null;

    Paste.prototype._container = null;

    Paste.mountNonInputable = function(nonInputable) {
      var paste;
      paste = new Paste(createHiddenEditable().appendTo(nonInputable), nonInputable);
      $(nonInputable).on('click', (function(_this) {
        return function(ev) {
          if (!isFocusable(ev.target, false)) {
            return paste._container.focus();
          }
        };
      })(this));
      paste._container.on('focus', (function(_this) {
        return function() {
          return $(nonInputable).addClass('pastable-focus');
        };
      })(this));
      return paste._container.on('blur', (function(_this) {
        return function() {
          return $(nonInputable).removeClass('pastable-focus');
        };
      })(this));
    };

    Paste.mountTextarea = function(textarea) {
      var ctlDown, paste, ref, ref1;
      if ((typeof DataTransfer !== "undefined" && DataTransfer !== null ? DataTransfer.prototype : void 0) && ((ref = Object.getOwnPropertyDescriptor) != null ? (ref1 = ref.call(Object, DataTransfer.prototype, 'items')) != null ? ref1.get : void 0 : void 0)) {
        return this.mountContenteditable(textarea);
      }
      paste = new Paste(createHiddenEditable().insertBefore(textarea), textarea);
      ctlDown = false;
      $(textarea).on('keyup', function(ev) {
        var ref2;
        if ((ref2 = ev.keyCode) === 17 || ref2 === 224) {
          ctlDown = false;
        }
        return null;
      });
      $(textarea).on('keydown', function(ev) {
        var ref2;
        if ((ref2 = ev.keyCode) === 17 || ref2 === 224) {
          ctlDown = true;
        }
        if ((ev.ctrlKey != null) && (ev.metaKey != null)) {
          ctlDown = ev.ctrlKey || ev.metaKey;
        }
        if (ctlDown && ev.keyCode === 86) {
          paste._textarea_focus_stolen = true;
          paste._container.focus();
          paste._paste_event_fired = false;
          setTimeout((function(_this) {
            return function() {
              if (!paste._paste_event_fired) {
                $(textarea).focus();
                return paste._textarea_focus_stolen = false;
              }
            };
          })(this), 1);
        }
        return null;
      });
      $(textarea).on('paste', (function(_this) {
        return function() {};
      })(this));
      $(textarea).on('focus', (function(_this) {
        return function() {
          if (!paste._textarea_focus_stolen) {
            return $(textarea).addClass('pastable-focus');
          }
        };
      })(this));
      $(textarea).on('blur', (function(_this) {
        return function() {
          if (!paste._textarea_focus_stolen) {
            return $(textarea).removeClass('pastable-focus');
          }
        };
      })(this));
      $(paste._target).on('_pasteCheckContainerDone', (function(_this) {
        return function() {
          $(textarea).focus();
          return paste._textarea_focus_stolen = false;
        };
      })(this));
      return $(paste._target).on('pasteText', (function(_this) {
        return function(ev, data) {
          var content, curEnd, curStart;
          curStart = $(textarea).prop('selectionStart');
          curEnd = $(textarea).prop('selectionEnd');
          content = $(textarea).val();
          $(textarea).val("" + content.slice(0, curStart) + data.text + content.slice(curEnd));
          $(textarea)[0].setSelectionRange(curStart + data.text.length, curStart + data.text.length);
          return $(textarea).trigger('change');
        };
      })(this));
    };

    Paste.mountContenteditable = function(contenteditable) {
      var paste;
      paste = new Paste(contenteditable, contenteditable);
      $(contenteditable).on('focus', (function(_this) {
        return function() {
          return $(contenteditable).addClass('pastable-focus');
        };
      })(this));
      return $(contenteditable).on('blur', (function(_this) {
        return function() {
          return $(contenteditable).removeClass('pastable-focus');
        };
      })(this));
    };

    function Paste(_container, _target) {
      this._container = _container;
      this._target = _target;
      this._container = $(this._container);
      this._target = $(this._target).addClass('pastable');
      this._container.on('paste', (function(_this) {
        return function(ev) {
          var clipboardData, file, item, j, k, len, len1, reader, ref, ref1, ref2, ref3, text;
          if (ev.currentTarget !== ev.target) {
            return ev.preventDefault();
          }
          _this._paste_event_fired = true;
          if (((ref = ev.originalEvent) != null ? ref.clipboardData : void 0) != null) {
            clipboardData = ev.originalEvent.clipboardData;
            if (clipboardData.items) {
              ref1 = clipboardData.items;
              for (j = 0, len = ref1.length; j < len; j++) {
                item = ref1[j];
                if (item.type.match(/^image\//)) {
                  reader = new FileReader();
                  reader.onload = function(event) {
                    return _this._handleImage(event.target.result);
                  };
                  try {
                    reader.readAsDataURL(item.getAsFile());
                  } catch (error) {}
                  ev.preventDefault();
                  break;
                }
                if (item.type === 'text/plain') {
                  item.getAsString(function(string) {
                    return _this._target.trigger('pasteText', {
                      text: string
                    });
                  });
                }
              }
            } else {
              if (-1 !== Array.prototype.indexOf.call(clipboardData.types, 'text/plain')) {
                text = clipboardData.getData('Text');
                setTimeout(function() {
                  return _this._target.trigger('pasteText', {
                    text: text
                  });
                }, 1);
              }
              _this._checkImagesInContainer(function(src) {
                return _this._handleImage(src);
              });
            }
          }
          if (clipboardData = window.clipboardData) {
            if ((ref2 = (text = clipboardData.getData('Text'))) != null ? ref2.length : void 0) {
              setTimeout(function() {
                _this._target.trigger('pasteText', {
                  text: text
                });
                return _this._target.trigger('_pasteCheckContainerDone');
              }, 1);
            } else {
              ref3 = clipboardData.files;
              for (k = 0, len1 = ref3.length; k < len1; k++) {
                file = ref3[k];
                _this._handleImage(URL.createObjectURL(file));
              }
              _this._checkImagesInContainer(function(src) {});
            }
          }
          return null;
        };
      })(this));
    }

    Paste.prototype._handleImage = function(src) {
      var loader;
      if (src.match(/^webkit\-fake\-url\:\/\//)) {
        return this._target.trigger('pasteImageError', {
          message: "You are trying to paste an image in Safari, however we are unable to retieve its data."
        });
      }
      this._target.trigger('pasteImageStart');
      loader = new Image();
      loader.crossOrigin = "anonymous";
      loader.onload = (function(_this) {
        return function() {
          var blob, canvas, ctx, dataURL;
          canvas = document.createElement('canvas');
          canvas.width = loader.width;
          canvas.height = loader.height;
          ctx = canvas.getContext('2d');
          ctx.drawImage(loader, 0, 0, canvas.width, canvas.height);
          dataURL = null;
          try {
            dataURL = canvas.toDataURL('image/png');
            blob = dataURLtoBlob(dataURL);
          } catch (error) {}
          if (dataURL) {
            _this._target.trigger('pasteImage', {
              blob: blob,
              dataURL: dataURL,
              width: loader.width,
              height: loader.height
            });
          }
          return _this._target.trigger('pasteImageEnd');
        };
      })(this);
      loader.onerror = (function(_this) {
        return function() {
          _this._target.trigger('pasteImageError', {
            message: "Failed to get image from: " + src,
            url: src
          });
          return _this._target.trigger('pasteImageEnd');
        };
      })(this);
      return loader.src = src;
    };

    Paste.prototype._checkImagesInContainer = function(cb) {
      var img, j, len, ref, timespan;
      timespan = Math.floor(1000 * Math.random());
      ref = this._container.find('img');
      for (j = 0, len = ref.length; j < len; j++) {
        img = ref[j];
        img["_paste_marked_" + timespan] = true;
      }
      return setTimeout((function(_this) {
        return function() {
          var k, len1, ref1;
          ref1 = _this._container.find('img');
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            img = ref1[k];
            if (!img["_paste_marked_" + timespan]) {
              cb(img.src);
              $(img).remove();
            }
          }
          return _this._target.trigger('_pasteCheckContainerDone');
        };
      })(this), 1);
    };

    return Paste;

  })();

}).call(this);

(function($,exports){

	var is_chrome	= navigator.userAgent.indexOf('Chrome') > -1,
		counter = 0,
		workflow;
		
	thepaste = exports.thepaste = $.extend( {
		supports : {
			paste: ( ('paste' in document) || ('onpaste' in document) || typeof(window.onpaste) === 'object' || ( 'onpaste' in document.createElement('DIV') ) ), // browser
		},
		view:{},
		
		insertImage:function( dataURL, type, editor ) {
			var id = '__thepaste_img_'+(counter++),
				imageHtml = '<img id="'+id+'" class="alignnone size-full" src="'+dataURL+'" />',
				$container;


			editor.insertContent( imageHtml );
			
			return editor.$('#'+id)[0];
		},

		uploadImage: function( image, editor ) {

			var xhr,
				workflow, 
				$container,
				src = image.src,
				upload = function( dataURL ){
					var id = '__thepaste_box_'+(counter++),
						type = dataURL.match(/^data\:([^\;]+)\;/)[1]
						file = new o.Blob( null, { data: dataURL } )
						suffix = thepaste.options.mime_types.convert[ type ];

					$(image).wrap('<div id="'+id+'" data-progress="0" class="thepaste-image-placeholder" contenteditable="false"></div>');
					$container = editor.$('#'+id);

					file.name = thepaste.l10n.pasted + '.' + suffix;
					file.type = type;

					var addFile = function(){
						workflow.uploader.uploader.uploader.addFile( file );
					}
					if ( ! workflow ) {
						workflow = wp.media.editor.open( window.wpActiveEditor, {
							frame:		'post',
							state:		'insert',
							title:		thepaste.l10n.copy_paste,
							multiple:	false
						} );

						workflow.close();

						if ( workflow.uploader.uploader && workflow.uploader.uploader.ready ) {
							addFile();
						} else {
							workflow.on( 'uploader:ready', addFile );
						}
					} else {
						workflow.state().reset();
						addFile();
					}
					workflow.uploader.uploader.uploader.bind('UploadProgress',function( e ){
						$container.attr('data-progress',e.total.percent);
					});
					workflow.uploader.uploader.uploader.bind('FileUploaded',function( up, args ){
						var imgHTML = '<img class="alignnone wp-image-'+args.attachment.id+' size-full" src="'+args.attachment.changed.url+'" />';
						// replace image
						$container.replaceWith( imgHTML );
						// replace other instances
						editor.$('img[src="'+src+'"]').each(function(){
							$(this).replaceWith( imgHTML );
						});
					});
					workflow.uploader.uploader.uploader.bind('Error',function( up, args ){
						console.log(up,args);
					});
				};

			if ( src.substr(0,5) === 'blob:' ) {

				xhr = new XMLHttpRequest();
				xhr.responseType = 'blob';
				xhr.onreadystatechange = function(){
					var reader;
					if ( xhr.readyState == 4 ) {
						reader = new FileReader();
						reader.onload = function() {

							upload( reader.result );

						}
						reader.readAsDataURL( xhr.response );
					}
				}
				xhr.open( 'GET', src );
				xhr.send( null );

			} else if ( src.substr(0,5) === 'data:' ) {

				upload( src );

			} 
			
		},

		/**
		 *	@return: null|true|false
		 */
		clipboardHasImage:function( clipboardData ) {
			var hasImage = false;
			if ( clipboardData.items ) {
				$.each( clipboardData.items, function(i,item){
					if ( item.type in thepaste.options.mime_types.paste ) {
						hasImage = true;
						return false;
					}
				} );
				return hasImage;
			}

			if ( clipboardData.types ) {
				$.each( thepaste.options.mime_types.paste, function(type,ext){
					if ( clipboardData.types.indexOf(type) > -1 ) {
						hasImage = true;
						return false;
					}
				} );
				return hasImage;
			}
			return null;
		}


	}, thepaste );

})( jQuery, wp.media );


(function($,exports){

	var counter      = 0,
		l10n = wp.media.thepaste.l10n,
		is_chrome = navigator.userAgent.indexOf('Chrome') > -1;

	$.extend( wp.Uploader.prototype, {
		success : function( file_attachment ){
		}
	});


	/**
	 *	Integrate into media library modal
	 */
	// add states to browse router
	_.extend( wp.media.view.MediaFrame.Select.prototype, {
		_parentInitialize: wp.media.view.MediaFrame.Select.prototype.initialize,
		initialize: function() {
			this._parentInitialize.apply( this, arguments );
			this.bindPasteHandlers();
		},
		_parentBrowseRouter: wp.media.view.MediaFrame.Select.prototype.browseRouter,
		browseRouter : function( view ) {
			this._parentBrowseRouter.apply(this,arguments);

			if ( wp.media.thepaste.supports.paste ) {
				view.set({pasteboard:{
					text:     l10n.copy_paste,
					priority: 35
				}});
			}
		},

		bindPasteHandlers: function() {
			var previousContent = false;
		
			// dismiss content on close
			this.on( 'content:render close' , function(content){
				if ( previousContent && 'function' === typeof previousContent.dismiss ) {
					previousContent.dismiss();
				}
				if ( 'undefined' !== typeof content )
					previousContent = content;
			} , this );
		
			this.on( 'content:create:pasteboard', this.contentCreatePasteboard, this );
			this.on( 'content:render:pasteboard', this.contentRenderGrabber, this );

			frame = this;
		},
		// add handlers
		contentCreatePasteboard: function( content ) {
			var state = this.state();

			this.currentPasteView = content.view = new wp.media.thepaste.view.DataSourceImageGrabber( { 
				controller	: this, 
				grabber		: wp.media.thepaste.view.Pasteboard
			});
			this.listenTo( this.currentPasteView.uploader, 'action:uploaded:dataimage', this.uploadedDataImage );
		},
		contentRenderGrabber: function( content ) {
			content.startGrabbing();
		},
		uploadedDataImage: function( content ) {
			this.stopListening( this.currentPasteView.uploader, 'action:uploaded:dataimage' );
			var obj = { view: null };
			this.browseContent(obj);
			this.content.set( obj.view );
			this.router.get().select('browse')
		}
	});
	


	/**
	 *	Add paste button to toolbar on upload.php
	 */
	_.extend( wp.media.view.AttachmentsBrowser.prototype, {
		_parentInitialize:	wp.media.view.AttachmentsBrowser.prototype.initialize,
		initialize:	function() {
			var self = this,
				pasteBtn;

			this._parentInitialize.apply(this,arguments);
			
			this.thepaste = {
				paste	: {
//					button	: false,
					grabber	: false,
					modal	: false,
					mode	: 'paste',
				},
				current		: false
			}

			if ( ! ( this.controller instanceof wp.media.view.MediaFrame.Select ) ) {

				if ( wp.media.thepaste.supports.paste ) {

					pasteBtn = new wp.media.view.Button( {
						text		: l10n.copy_paste,
						className:  'grabber-button',
						priority	: -64,
						click: function() {
							self.thepaste.active = self.thepaste.paste;
							self.pasteOpen( l10n.copy_paste );
						}
					} );
					this.thepaste.paste.grabber = new wp.media.thepaste.view.DataSourceImageGrabber( {
						controller	: this.controller,
						grabber		: wp.media.thepaste.view.Pasteboard,
						wpuploader	: this.controller.uploader.uploader.uploader
					} );

					this.toolbar.set( 'pasteModeButton', pasteBtn.render() );
				}
			}
		},
		thepasteUploaded: function( e ) {
			this.thepaste.active.grabber.dismiss();
			this.thepaste.modal.close();
			this.thepasteClose();
		},
		thepasteError: function( e ) {
			console.log( 'error', e );
		},
		pasteOpen: function( title ) {
			var self = this;

			this.thepaste.modal  =  new wp.media.view.Modal( {
				controller : this,
				title      : title
			} );
			this.thepaste.modal.content( this.thepaste.active.grabber );
			this.thepaste.modal.open();

			this.thepaste.modal.on( 'close', function() {
				self.thepasteClose.apply(self);
				self.thepaste.active.grabber.stopGrabbing();
			});

			this.thepaste.active.grabber.startGrabbing();

			this.listenTo( this.thepaste.active.grabber.uploader, 'action:uploaded:dataimage', this.thepasteUploaded );
			this.listenTo( this.thepaste.active.grabber.uploader, 'error:uploaded:dataimage', this.thepasteError );
		},
		thepasteClose: function() {

			this.controller.deactivateMode( this.thepaste.active.mode ).activateMode( 'edit' );

			this.stopListening( this.thepaste.active.grabber.uploader, 'action:uploaded:dataimage' );
			this.stopListening( this.thepaste.active.grabber.uploader, 'error:uploaded:dataimage' );
		}
	});
	
})(jQuery,window);

(function($,window,o){
	var thepaste = wp.media.thepaste,
		Button = wp.media.view.Button,
		Modal  = wp.media.view.Modal,
		l10n   = thepaste.l10n;


	wp.media.thepaste.view.DataSourceImageUploader = wp.media.View.extend({
		template: wp.template('thepaste-uploader'),
		className: 'thepaste-uploader',
		controller:null,
		image : null,
		$discardBtn : null,
		$uploadBtn : null,
		
		uploader : null,
		
		events : {
			'click [data-action="upload"]'	: 'uploadImage',
			'click [data-action="discard"]'	: 'discardImage',
		},
		initialize : function() {

			wp.media.View.prototype.initialize.apply( this, arguments );

			_.defaults( this.options, {
				defaultFileName : l10n.image
			});
			var self = this,
				instr = new wp.media.View({
				tagName    : 'div',
				className  : 'instruments',
				controller : this.controller
			});

			this.uploader = this.options.uploder;
		},
		setImageData : function( data ) {
			var container = this.$imageContainer.html('').get(0),
				self = this,
				format = data.match(/data:(image\/(\w+));/)[1];

			if ( ! thepaste.options.mime_types.convert[format] ) {
				format = this.options.defaultFileFormat;
			}
			
			if ( this.image ) {
				this.image.destroy();
			}

			this.image = new o.Image();
			this.image.onload = function() {
				var opts = self.getUploader().getOption('resize'),
					scale = Math.max( opts.width / this.width, opts.height / this.height );

				!!opts && (scale < 1) && this.downsize( this.width*scale, this.height*scale );

				this.embed( container );
			}
			this.image.bind('Resize', function(e) {
				this.embed( container );
			});
			this.image.load( data );
			if ( this.$imageContainer ) {
				this.$imageContainer.append(this.image);
			}
			this.$('[data-setting="format"] input[value="'+format+'"]').prop( 'checked', true );


			this.disabled(false);
			return this;
		},
		render : function() {
			wp.media.View.prototype.render.apply(this,arguments);
			this.$imageContainer = this.$('.image-container');
			this.$discardBtn = this.$('[data-action="discard"]');
			this.$uploadBtn = this.$('[data-action="upload"]');
			this.$('[data-setting="title"]').val( this.options.defaultFileName );
			return this;
		},
		discardImage : function(){
			this.trigger( 'action:discard:dataimage' , this );
			this.unbindUploaderEvents();
		},
		uploadImage : function() {

			var type = this.$('[data-setting="format"] :checked').val(),
				suffix = thepaste.options.mime_types.convert[ type ],
				name = this.$('input[data-setting="title"]').val() + '.' + suffix,
				blob = this.image.getAsBlob( type, thepaste.options.jpeg_quality );

			this.bindUploaderEvents();

			blob.detach( blob.getSource() );
			blob.name = name;
			blob.type = type;
			this.getUploader().addFile( blob , name );

			this.disabled( true );

			this.trigger( 'action:upload:dataimage' , this );
		},
		show:function(){
			this.$el.show();
			return this;
		},
		hide:function(){
			this.$el.hide();
			return this;
		},
		disabled : function( disabled ) {
			this.$discardBtn.prop( 'disabled', disabled );
			this.$uploadBtn.prop( 'disabled', disabled );
		},
		_uploadSuccessHandler : function() {
			this.trigger( 'action:uploaded:dataimage' );
			this.disabled(false);
			this.unbindUploaderEvents();
		},
		_uploadErrorHandler : function() {
			this.trigger( 'error:uploaded:dataimage' );
			this.disabled(false);
			this.unbindUploaderEvents();
		},
		bindUploaderEvents : function() {
			this.getUploader().bind( 'FileUploaded',	this._uploadSuccessHandler,	this );
			this.getUploader().bind( 'Error',			this._uploadErrorHandler,	this );
		},
		unbindUploaderEvents : function() {
			this.getUploader().unbind( 'FileUploaded',	this._uploadSuccessHandler,	this );
			this.getUploader().unbind( 'Error',			this._uploadErrorHandler,	this );
		},
		getUploader: function() {
			return this.controller.uploader.uploader.uploader;
		}
	});


	wp.media.thepaste.view.Pasteboard = wp.media.View.extend({
		template: wp.template('thepaste-pasteboard'),
		className: 'thepaste-pasteboard',
		controller:null,
		action:'paste',
		$pasteboard : null,

		render: function() {
			var self = this;
			wp.media.View.prototype.render.apply(this,arguments);
			this.$pasteboard = this.$( '.injector' ).pastableContenteditable();
			this.$message = this.$( '.message' );
			this.$pasteboard.on('click', function(){
				self.show_message('');
			} );
			return this;
		},
		start : function() {
			var self = this,
				clipboardHasImage;

			this.imagePasted = false;

			this.$pasteboard
				.on('paste',function(e){
					clipboardHasImage = wp.media.thepaste.clipboardHasImage(e.originalEvent.clipboardData);
				})
				.on('pasteText' , function( e, data ) {

					if ( clipboardHasImage || self.imagePasted ) {
						return;
					}
					self.show_message( l10n.paste_error_no_image );
					$( this ).html('');
				} )
				.on('pasteImage' , function( e, data ) {
					if ( self.imagePasted ) {
						return;
					}
					self.trigger( 'action:create:dataimage', this , data.dataURL );
					self.imagePasted = true;
				} )
				.on('pasteImageError' , function( e, data ) {
					self.show_message( l10n.paste_error );
					$( this ).html('');
				} )
				;

			setTimeout(function(){
				self.$pasteboard.get(0).focus();
			},1);

			return this;
		},
		stop : function() {
			this.$pasteboard
				.off('pasteImage')
				.off('pasteImageError')
				.off('pasteText');
			return this;
		},
		show:function() {
			this.$el.show();
			return this;
		},
		hide:function() {
			this.$el.hide();
			return this;
		},
		show_message:function( msg ) {
			this.$message.text( msg );
		}
	});

	wp.media.thepaste.view.DataSourceImageGrabber = wp.media.View.extend({
//		tagName:   'div',
		template: wp.template('thepaste-grabber'),
		className : 'thepaste-grabber',
		
		grabber : null,
		uploader : null,
		
		initialize : function() {
			var ret = wp.media.View.prototype.initialize.apply( this, arguments );

			_.defaults( this.options, {
				wpuploader		: null,
				defaultFileName	: l10n.pasted,
				defaultFileFormat : 'image/png',
				title			: l10n.copy_paste 
			});

			this.grabber  = new this.options.grabber( { controller	: this.controller } );

			this.uploader = new wp.media.thepaste.view.DataSourceImageUploader( {	
									controller			: this.controller,
									uploder				: this.options.wpuploader,
									defaultFileName		: this.options.defaultFileName,
									defaultFileFormat	: this.options.defaultFileFormat
								});
			this.render();

			this.listenTo( this.grabber, 'action:create:dataimage',	this.imageCreated );
			this.listenTo( this.uploader, 'action:discard:dataimage',	this.startGrabbing );

			return ret;
		},
		render:function(){
			var self = this;

			wp.media.View.prototype.render.apply( this, arguments );

			this.$('.content')
				.append( this.grabber.render().$el )
				.append( this.uploader.render().$el );

			return this;
		},
		imageCreated : function( grabber , imageData ) {
			this.grabber.stop().hide();
			this.uploader.show().setImageData( imageData );
		},
		startGrabbing:function() {
			this.uploader.hide();
			this.grabber.show().start();
			return this;
		},
		stopGrabbing:function() {
			this.grabber.stop();
			return this;
		},
		getAction : function() {
			return this.grabber.action;
		},
		dismiss:function() {
			this.grabber.stop();
			return this;
		}
	});

})(jQuery,window,mOxie);
