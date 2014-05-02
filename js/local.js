var app = new ocuLeap;
$(document).ready(function(){
	app.init();
	$(document).on('mouseover','#instruction',function(e){
		$(this).css({opacity:1})
	})
	$(document).on('mouseleave','#instruction',function(e){
		$(this).css({opacity:0})

	})
})