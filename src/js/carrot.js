$(function() {
  $.material.init();
  $('#contentMain').scrollspy({ target: '#navItems' });
  $('.js-veil').removeClass('js-veil');

  var scrollToSection = function(hash) {
    var pos = 0;
    var container = '';

    if ($('body')[0].clientWidth == $('#contentMain')[0].clientWidth) {
      // Mobile (nav on top) view
      // html is required for this to work in Firefox for whatever reason
      container = 'html, body';
      pos = $(hash).offset().top;
    } else {
      // Desktop (nav on left) view
      container = '#contentMain';
      pos = $(hash).position().top - $(hash).parent().position().top;
    }

    $(container).animate({
      scrollTop: pos
    }, 250, function(){
      window.history.pushState(null, null, hash);
    });
  };

  $("ul.nav li a").on('click', function(e) {
    var hash = this.hash;
    scrollToSection(hash);
    e.preventDefault();
  });

  $('a[rel="external"]').on('click', function(e) {
    window.open($(this).attr('href'));
    e.preventDefault();
  });

  window.addEventListener('hashchange', function() {
    scrollToSection(location.hash);
  });
});
