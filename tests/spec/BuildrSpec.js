describe("Buildr", function() {

  var $div;
  var Person = function(fname, lname, options){
    this.fname = fname;
    this.lname = lname;
    this.name = function(){
      return this.fname + ' ' + this.lname;
    }.bind(this);
    $.extend(this, options);
  }

  var stooges = [
    new Person('Moe'    , 'Howard'  , {dob: new Date('1897-06-19')}),
    new Person('Larry'  , 'Fine'    , {dob: new Date('1902-10-05')}),
    new Person('Curly'  , 'Howard'  , {dob: new Date('1903-10-22')})
  ];

  var duo = [
    new Person('William', 'Abbott'  , {dob: new Date('1895-10-02')}),
    new Person('Lou'    , 'Costello', {dob: new Date('1906-03-06')})
  ];

  var highlight = function(){
    var $el = $(this);
    $el.closest('table').find('tr').removeClass('highlight');
    $el.addClass('highlight');
  };

  var highlightAll = function(){
    $(this).addClass('highlight');
  };

  beforeEach(function(){
    $div = $('<div>');
  });

  //use raw jQuery as the baseline
  var $stooges = $('<div>').append($('<h1>').text('The Three Stooges')).
    append($('<ol>', {id: 'stooges', class: 'comedians'}).append(function(){
      return $.map(stooges, function(stooge, idx){
        return $('<li>').text(stooge.name()).get();
      });
    }));

  describe("when building the dom", function() {
    it("tag names may be used as methods", function() {
      $div.build(function(b){
        b.h1('The Three Stooges');
        b.ol({id: 'stooges', class: 'comedians'}, function(){
          $.each(stooges, function(idx, stooge){
            b.li(stooge.name());
          });
        });
      });
      expect($div.html()).toEqual($stooges.html());
    });

    it("tags may be described using id and class methods", function() {
      $div.build(function(b){
        b.h1('The Three Stooges');
        b.ol().id('stooges').class('comedians').el(stooges, function(idx, stooge){
          b.li().text(stooge.name());
        });
      });
      var ol = $div.find('ol');
      expect(ol.attr('id')).toEqual('stooges');
      expect(ol.attr('class')).toEqual('comedians');
      expect($div.html()).toEqual($stooges.html());
    });

    it("tags may appear inline within other tags", function() {
      $div.build(function(b){
        b.h1('The Three Stooges');
        b.ol({id: 'stooges', class: 'comedians'}, b.li("Moe Howard"), b.li("Larry Fine"), b.li("Curly Howard"));
      });
      expect($div.html()).toEqual($stooges.html());
    });

    it("tags may be nested within other tags", function() {
      $div.build(function(b){
        b.h1('The Three Stooges');
        b.ol({id: 'stooges', class: 'comedians'}).el(b.li("Moe Howard"), b.li("Larry Fine"), b.li("Curly Howard"));
      });
      expect($div.html()).toEqual($stooges.html());
    });

    it("tags may use multiple iterators", function() {
      var renderComedian = function(idx, comedian){
        this.li().text(comedian.name());
      };
      $div.build(function(b){
        b.h1('Comedians');
        b.ol({class: 'comedians'}, function(){
          b.each(stooges, renderComedian);
          b.each(duo    , renderComedian);
        });
      });
      expect($div.find('li').length).toEqual(5);
    });

    it("tags may use inline iterators", function() {
      $div.build(function(b){
        b.h1('The Three Stooges');
        b.ol({id: 'stooges', class: 'comedians'}, stooges, function(idx, stooge){
          b.li().text(stooge.name());
        });
      });
      expect($div.html()).toEqual($stooges.html());
    });

    it("tags may not be nested within self-closing tags", function() {
      var errors = [];
      try {
        $div.build(function(b){
          b.img(b.div('Alcatraz'));
        });
      } catch (err) {
        errors.push(err);
      }
      try {
        $div.build(function(b){
          b.br(function(){
            b.div('Alcatraz');
          });
        });
      } catch (err) {
        errors.push(err);
      }
      expect(errors.length).toEqual(2);
      $.each(errors, function(idx, error){
        expect(error instanceof Buildr.NestingProhibitedError).toBeTruthy();
      });
      expect(errors[0].tag).toEqual('img');
      expect(errors[1].tag).toEqual('br');
    });

    it("using that dastardly with statement eliminates the need to prefix everything", function() {
      $div.build(function(b){ with(b) {
        h1('The Three Stooges');
        ol({id: 'stooges', class: 'comedians'}, stooges, function(idx, stooge){
          li().text(stooge.name());
        });
      }});
      expect($div.html()).toEqual($stooges.html());
    });

    it("tags may use multiple inline iterators", function() {
      $div.build(function(b){
        b.h1('Comedians');
        b.ol({class: 'comedians'}, stooges, function(idx, stooge){
          b.li().text(stooge.name());
        }, duo, function(idx, comedian){
          b.li().text(comedian.name());
        });
      });
      expect($div.find('li').length).toEqual(5);
    });

    it("it supports a wide number of syntactical options", function() {
      var html1 = $('<div>').build(function(b){
        b.table(function(){
          b.caption(b.b('The Three Stooges'));
          b.each(stooges, function(idx, stooge){ //iterator with no wrapper (i.e. each)
            b.tr(function(){
              b.td(stooge.fname);
              b.td(stooge.lname);
              b.td(stooge.dob);
            }).click(highlight);
          });
        });
      }).html();

      var html2 = $('<div>').build(function(b){
        b.table(function(){
          b.caption(b.b('The Three Stooges'));
          b.each(stooges, function(idx, stooge){  //iterator with no wrapper (i.e. each)
            b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
          });
        });
      }).html();

      var html3 = $('<div>').build(function(b){
        b.table({id: 'stooges'}, function(){
          b.caption(b.b('The Three Stooges'));
          b.tbody(stooges, function(idx, stooge){ //iterator with wrapper (i.e. tbody)
            b.tr(function(){
              b.td(stooge.fname);
              b.td(stooge.lname);
              b.td(stooge.dob);
            }).click(highlight);
          });
        });
      }).html();

      var html4 = $('<div>').build(function(b){ //iterator with wrapper (i.e. tbody)
        b.table({id: 'stooges'}, function(){
          b.caption(b.b('The Three Stooges'));
          b.tbody(stooges, function(idx, stooge){
            b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
          });
        });
      }).html();

      var html5 = $('<div>').build(function(b){ //iterator with wrapper (i.e. tbody)
        b.table().id('stooges').el(function(){
          b.caption(b.b('The Three Stooges'));
          b.tbody().el(stooges, function(idx, stooge){
            b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
          });
        });
      }).html();

      var html6 = $('<div>').build(function(b){ with(b) {
        table({id: 'stooges'}, function(){
          caption(b('The Three Stooges'));
          tbody(stooges, function(idx, stooge){ //iterator with wrapper (i.e. tbody)
            tr(td(stooge.fname), td(stooge.lname), td(stooge.dob)).click(highlight);
          });
        });
      }}).html();

      var html7 = $.build().div().el(function(b){
        b.table({id: 'stooges'}, function(){
          b.caption(b.b('The Three Stooges'));
          b.tbody(stooges, function(idx, stooge){
            b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
          });
        });
      }).html();

      var html8 = $.build().div(function(b){
        b.table({id: 'stooges'}, function(){
          b.caption(b.b('The Three Stooges'));
          b.tbody(stooges, function(idx, stooge){
            b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
          });
        });
      }).html();

      var html9 = $.build(function(b){
        b.div(
          b.table({id: 'stooges'}, function(){
            b.caption(b.b('The Three Stooges'));
            b.tbody(stooges, function(idx, stooge){
              b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
            });
          })
        );
      }).html();

      var html10 = $.build(function(b){
        b.div(
          b.table({id: 'stooges'},
            b.caption(b.b('The Three Stooges')),
            b.tbody(stooges, function(idx, stooge){
              b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(stooge.dob)).click(highlight);
            })
          )
        )
      }).html();

      var html11 = $.build(function(){ //reference 'this' instead of b
        this.div(
          this.table({id: 'stooges'},
            this.caption(this.b('The Three Stooges')),
            this.tbody(stooges, function(idx, stooge){
              this.tr(this.td(stooge.fname), this.td(stooge.lname), this.td(stooge.dob)).click(highlight);
            })
          )
        )
      }).html();

      var html12 = $.build(function(b){
        b.div(
          b.h1('The Three Stooges'),
          b.ol({id: 'stooges', class: 'comedians'}, b.li("Moe Howard"), b.li("Larry Fine"), b.li("Curly Howard"))
        );
      }).html();

      var html13 = $.build(function(b){
        b.div(
          b.h1('The Three Stooges'),
          b.ol({id: 'stooges', class: 'comedians'}).el(b.li("Moe Howard"), b.li("Larry Fine"), b.li("Curly Howard"))
        );
      }).html();

      var html14 = $.build(function(b){
        b.div(
          b.h1('The Three Stooges'),
          b.ol().id('stooges').class('comedians').el(b.li("Moe Howard"), b.li("Larry Fine"), b.li("Curly Howard"))
        );
      }).html();

      var html15 = $.build(function(b){
        b.div(
          b.h1('The Three Stooges'),
          b.ol({id: 'stooges', class: 'comedians'}, function(){
            b.li("Moe Howard");
            b.li("Larry Fine");
            b.li("Curly Howard");
          })
        );
      }).html();

      var html16 = $('<div>').build(function(b){
        b.h1('The Three Stooges');
        b.ol({id: 'stooges', class: 'comedians'}, function(){
          b.li("Moe Howard");
          b.li("Larry Fine");
          b.li("Curly Howard");
        });
      }).html();

      expect(html1).toEqual(html2);
      expect(html3).toEqual(html4);
      expect(html3).toContain('<tbody>');
      expect(html3).toEqual(html5);
      expect(html3).toEqual(html6);
      expect(html3).toEqual(html7);
      expect(html3).toEqual(html8);
      expect(html3).toEqual(html9);
      expect(html3).toEqual(html10);
      expect(html3).toEqual(html11);
      expect(html12).toEqual(html13);
      expect(html12).toEqual(html14);
      expect(html12).toEqual(html15);
      expect(html12).toEqual(html16);
    });

    it("custom tags may be locally defined", function() {
      //Buildr.prototype.defineTag('dob');
      var html = $.build(function(b){
        b.defineTag('dob');
        b.div(
          b.table({id: 'stooges'},
            b.caption(b.b('The Three Stooges')),
            b.tbody(stooges, function(idx, stooge){
              b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(b.dob(stooge.dob))).click(highlight);
            })
          )
        )
        expect(b.tags).toContain('dob');
      }).html();
      expect($.build.tags).toNotContain('dob');
    });

    it("custom tags may be locally defined as a string", function() {
      var bldr = $.build('dob', function(b){
        b.div(
          b.table({id: 'stooges'},
            b.caption(b.b('The Three Stooges')),
            b.tbody(stooges, function(idx, stooge){
              b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(b.dob(stooge.dob))).click(highlight);
            })
          )
        )
        expect(b.tags).toContain('dob');
      });
      expect($.build.tags).toNotContain('dob');
    });

    it("custom tags may be globally defined", function() {
      $.build.defineTag('dob');
      var html = $.build(function(b){
        b.div(
          b.table({id: 'stooges'},
            b.caption(b.b('The Three Stooges')),
            b.tbody(stooges, function(idx, stooge){
              b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(b.dob(stooge.dob))).click(highlight);
            })
          )
        )
        expect(b.tags).toContain('dob');
      }).html();
      expect($.build.tags).toContain('dob');
    });


    it("partials may be defined via extension", function() {
      var $el = $div.build({
        stooge: function(idx, stooge){
          this.tr(function(){ //'this' refers to Buildr instance.
            this.td(stooge.fname);
            this.td(stooge.lname);
            this.td(stooge.dob);
          }).click(highlight);
        }
      }, function(b){
        b.table(function(){
          b.caption('The Three Stooges');
          $.each(stooges, b.stooge); //partial
        });
      });

      //create a custom builder
      var $tabular = $.build({
        comedians: function(caption, comedians){ //renders the collection
          return this.table(function(){
            this.caption(caption);
            this.each(comedians, this.comedian);
          });
        },
        comedian: function(idx, comedian){ //renders the item
          return this.tr(this.td(comedian.fname), this.td(comedian.lname), this.td(comedian.dob)).click(highlight);
        }
      });

      var $stooges = $tabular.build(function(b){
        b.comedians('The Three Stooges', stooges);
      });

      var $duo = $tabular.build(function(b){
        b.comedians('Abbott & Costello', duo);
      });

      var $el2 = $('<div>').append($stooges);
      var $el3 = $('<div>').append($duo);

      expect($duo instanceof $).toBeTruthy();
      expect($el.find('td').length).toEqual(9);
      expect($el.html()).toEqual($el2.html());
      expect($el3.find('tr').length).toEqual(2); //reusing the $tabular builder should carry nothing forward from prior renderings
    });

  });

  describe("when calling build", function() {

    it("returns a buildr object if no functions are passed", function() {
      var bldr     = $.build();
      var $tabular = $.build({ //pass only a mixin
        comedians: function(caption, comedians){ //renders the collection
          return this.table(function(){
            this.caption(caption);
            this.each(comedians, this.comedian);
          });
        },
        comedian: function(idx, comedian){ //renders the item
          return this.tr(this.td(comedian.fname), this.td(comedian.lname), this.td(comedian.dob)).click(highlight);
        }
      });
      expect(bldr instanceof Buildr).toBeTruthy();
      expect($tabular instanceof Buildr).toBeTruthy();
    });

    it("returns a jQuery object (containing all root-level elements built in the function) if any functions are passed", function() {
      var $el  = $.build(function(b){ //this function has no return statement.
        b.div( //this is the only root-level element (other elements are nested)
          b.table({id: 'stooges'},
            b.caption(b.b('The Three Stooges')),
            b.tbody(stooges, function(idx, stooge){
              b.tr(b.td(stooge.fname), b.td(stooge.lname), b.td(b.dob(stooge.dob))).click(highlight);
            })
          )
        )
        expect(b.tags).toContain('dob');
      });
      expect($el  instanceof $).toBeTruthy();
    });

    it("returns a jQuery object (containing the result of the function) if any functions are passed", function() {
      var $roses  = $.build(function(b){ //this function has a return statement
        var roses = b.p('Roses are red');
        b.p('Violets are blue');
        return roses;
      });
      var $violets  = $.build(function(b){ //this function has a return statement
        b.p('Roses are red');
        return b.p('Violets are blue');
      });
      expect($roses.html()).toEqual("Roses are red");
      expect($violets.html()).toEqual("Violets are blue");
    });

  });

});
