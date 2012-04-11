(function($, exports){

  var Buildr = exports.Buildr = function(){
    this.stack = [];
    this.elements = [];
  };

  var isObject = function( obj ) {
    if (Object.prototype.toString.call(obj) !== "[object Object]")
      return false;

    var key;
    for(key in obj){}

    return !key || Object.prototype.hasOwnProperty.call(obj, key);
  };

  var isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  var original = {};
  var overwrite = ['append', 'prepend'];
  $.each(overwrite, function(idx, method){
    original[method] = $.fn[method];
    $.fn[method] = function(){
      var args  = $.makeArray(arguments);
      var nodes = extractNodes.apply(this, args);
      return original[method].apply(this, nodes);
    };
  });

	var touched = true;
  var untouch = function(){ //don't touch my core jQuery methods!
    $.each(overwrite, function(idx, method){
      $.fn[method] = original[method];
    });
    touched = false;
  };

  var extractNodes = function(){
    var args = $.makeArray(arguments);
    return $.map(args, function(arg){
      return arg instanceof Buildr ? arg.root() : arg;
    });
  };

  var TagList = function(){
    var args = $.makeArray(arguments);
    this.list = []
    this.define.apply(this, args);
  };

  $.extend(TagList.prototype, {
    define: function(){
      var args = $.makeArray(arguments);
      var options = (isObject(args[0]) ? args.shift() : {})
      var list = this.list;
      $.each(args, function(idx, tag){
        Buildr.prototype[tag] = function(){
          var args = $.makeArray(arguments);
          args.unshift(tag);
          return this.tag.apply(this, args);
        };
        list.push(tag);
      });
    }
  });

  var tags = new TagList('a','abbr','acronym','address','article','aside','audio','b','bdi','bdo','big','blockquote','body','button','caption','canvas','command','cite','code','colgroup','datalist','dd','del','details','dfn','div','dl','dt','em','embed','fieldset','figcaption','figure','footer','form','frameset','h1','h2','h3','h4','h5','h6','head','header','hgroup','html','i','iframe','ins','keygen','kbd','label','legend','li','map','mark','meter','nav','noframes','noscript','object','ol','optgroup','option','output','p','pre','progress','q','rp','rt','ruby','samp','section','script','select','small','source','span','strong','style','sub','summary','sup','table','tbody','td','textarea','tfoot','thead','time','title','tr','track','tt','ul','var','video','wbr');
  var selfClosingTags = new TagList('area','base','br','col','frame','hr','img','input','link','meta','param');

  var element = {
    id: function(id){
      return this.attr({id: id});
    },
    'class': function(classes){
      this.removeClass();
      return this.addClass(classes);
    },
    nest: function(fnOrText){
      var b = this.buildr(), result;
      b.stack.unshift(this);
      $.isFunction(fnOrText) ? (result = fnOrText.call(b, b)) : this.text(fnOrText);
      isString(result) && this.text(result);
      b.stack.shift();
      return this;
    }
  };
  element.child = element.nest; //alias

  var build = function(fn){
    this.elements.splice(0, this.elements.length); //clear elements
    return fn ? (fn.call(this, this) || this.root()) : this;
  };

  $.extend(Buildr.prototype, {
    buildr: build,
    build: build,
    tag: function(){
      var self    = this,
          args    = $.makeArray(arguments),
          tag     = args.shift(), selfClosing = selfClosingTags.list.indexOf(tag) > -1,
          getSelf = function(){return self;},
          $el     = this.$ = $.extend($('<'+tag+'>'), {buildr: getSelf, build: getSelf}),
          $outer  = this.stack[0],
          fnOrText,
          items, iterator;

      if (touched) $.extend($el, element);
 
      selfClosing && (delete $el.nest) && (delete $el.child);

      this.elements.push($el);

      //decipher arguments
      while (args.length > 0 ){
        var arg = args.shift();
        if (arg instanceof $ && !selfClosing) { //inner element
          $el.append(arg);
				} else if ($.isArray(arg) && $.isFunction(args[0])) {
					items = arg, iterator = args.shift(), fnOrText = function(){self.each(items, iterator);};
        } else if ($.isFunction(arg) || isString(arg)) {
          fnOrText = arg;
        } else if (isObject(arg)) {
          $el.attr(arg); //attributes
        }
      }

      $outer && $outer.append($el);
      fnOrText && $el.nest && $el.nest(fnOrText);

      return $el;
    },
    root: function(){ //root (parentless) elements
      return $.grep(this.elements, function($el){
        return $el.parent().length === 0;
      });
    },
    each: function(items, iterator){
      $.each(items, iterator.bind(this));
      return this;
    },
    extend: function(){
      var mixins = $.makeArray(arguments), self = this;
      $.each(mixins, function(idx, mixin){
        $.each(mixin, function(key, method){
          self[key] = method.bind(self); //maintain binding to builder
        });
      });
      return self;
    }
  });

  $.extend(Buildr, {
    untouch: untouch,
    tags: tags,
    selfClosingTags: selfClosingTags
  });

  $.buildr = function() {
    var bldr    = new Buildr();
    var args    = $.makeArray(arguments);
    var built   = [];

    while(args.length > 0){
      var arg = args.shift();
      isObject(arg) ? bldr.extend(arg) : built.push(bldr.buildr(arg));
    }

    built = $.map(built, function(obj){ //flatten
      return obj;
    });

    return built.length > 0 ? built : bldr;
  };

  $.fn.buildr = function(){
    var args = $.makeArray(arguments);
    var $el  = $.buildr.apply($.buildr, args);
    return this.append($el);
  };

  //alias to verb
  $.build    || ($.build    = $.buildr);
  $.fn.build || ($.fn.build = $.fn.buildr);

})(jQuery, this);
