describe("Buildr", function() {

	var $div;
  var stooges = [
    {fname: 'Moe'  , lname: 'Howard', dob: '06/19/1897'},
    {fname: 'Larry', lname: 'Fine'  , dob: '10/05/1902'},
    {fname: 'Curly', lname: 'Howard', dob: '10/22/1903'}
  ];

  var name = function(){
    return this.fname + ' ' + this.lname;
  };

  $.each(stooges, function(idx, stooge){
    stooge.name = name.bind(stooge);
  });

	beforeEach(function(){
		$div = $('<div>');
	});

	//using only core jQuery
  var $baseline = $('<div>').append($('<h1>').text('The Three Stooges')).
    append($('<ol>',{class: 'stooges'}).append(function(){
      return $.map(stooges, function(stooge, idx){
        return $('<li>').text(stooge.name()).get();
      });
    }));

  describe("when building the dom", function() {
    it("should allow me to call tags as methods", function() {
      $div.build(function(b){
        b.h1('The Three Stooges');
        b.ol({class: 'stooges'}, function(){
          $.each(stooges, function(idx, stooge){
            b.li(stooge.name());
          })
        });
      });
      expect($div.html()).toEqual($baseline.html());
    });
  });
});
