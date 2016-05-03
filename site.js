$.extend($.easing,
{
    def: 'easeOutQuad',
    easeInOutExpo: function (x, t, b, c, d) {
        if (t==0) return b;
        if (t==d) return b+c;
        if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
        return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
});

(function( $ ) {

    var settings;
    var disableScrollFn = false;
    var navItems;
    var navs = {}, sections = {};

    $.fn.navScroller = function(options) {
        settings = $.extend({
            scrollToOffset: 170,
            scrollSpeed: 800,
            activateParentNode: true,
        }, options );
        navItems = this;

        //attatch click listeners
        navItems.on('click', function(event){
            event.preventDefault();
            var navID = $(this).attr("href").substring(1);
            disableScrollFn = true;
            activateNav(navID);
            populateDestinations(); //recalculate these!
            $('html,body').animate({scrollTop: sections[navID] - settings.scrollToOffset},
                settings.scrollSpeed, "easeInOutExpo", function(){
                    disableScrollFn = false;
                }
            );
        });

        //populate lookup of clicable elements and destination sections
        populateDestinations(); //should also be run on browser resize, btw

        // setup scroll listener
        $(document).scroll(function(){
            if (disableScrollFn) { return; }
            var page_height = $(window).height();
            var pos = $(this).scrollTop();
            for (i in sections) {
                if ((pos + settings.scrollToOffset >= sections[i]) && sections[i] < pos + page_height){
                    activateNav(i);
                }
            }
        });
    };

    function populateDestinations() {
        navItems.each(function(){
            var scrollID = $(this).attr('href').substring(1);
            navs[scrollID] = (settings.activateParentNode)? this.parentNode : this;
            sections[scrollID] = $(document.getElementById(scrollID)).offset().top;
        });
    }

    function activateNav(navID) {
        for (nav in navs) { $(navs[nav]).removeClass('active'); }
        $(navs[navID]).addClass('active');
    }
})( jQuery );

// Populate contributors section
$(function(){

    var property = function(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };
    var pluck = function(obj, key){
        return obj.map(property(key));
    }
    var processData = function(data){
        return data.map(
            function(contributor){
                return {
                    commits: pluck(contributor.weeks, 'c').reduce(function(a, b) { return a+b; }),
                    avatar: contributor.author.avatar_url,
                    name: contributor.author.login,
                    url: contributor.author.html_url
                }
            }
        );
    };

    $.when(
        $.getJSON('https://api.github.com/repos/coala-analyzer/coala/stats/contributors'),
        $.getJSON('https://api.github.com/repos/coala-analyzer/coala-bears/stats/contributors')
    ).done(function(data1, data2){
        var processed = processData(data1[0].concat(data2[0]));
        
        for (var i = 0; i < processed.length; i++) {
            for(var j=i+1; j < processed.length; j++) {
                if (processed[i]['name'] == processed[j]['name']) {
                    processed[i]['commits'] += processed[j]['commits'];
                    processed.splice(j, 1);
                }
            }
        }

        var sorted = processed.sort(function(a, b){
            return a.commits > b.commits;
        });
        sorted.reverse();
        sorted.slice(0,10).forEach(function(contributor, index){
            $template = $('#contributors .template').clone();
            $template.removeClass('template');
            $template.find('.gravatar').attr('src', contributor.avatar);
            $template.find('.commits strong').text(contributor.commits);
            $template.find('.nick a').text(contributor.name);
            $template.find('.nick a').attr('href', contributor.url)
            $template.show().appendTo('#contributors');
        });

        // Change contributor count
        $('#contributor-count').text(processed.length);
    });
});

$(document).ready(function (){

    $('nav li a').navScroller();

    //section divider icon click gently scrolls to reveal the section
    $(".sectiondivider").on('click', function(event) {
        $('html,body').animate({scrollTop: $(event.target.parentNode).offset().top - 50}, 400, "linear");
    });

    //links going to other sections nicely scroll
    $(".container a").each(function(){
        if ($(this).attr("href").charAt(0) == '#'){
            $(this).on('click', function(event) {
                event.preventDefault();
                var target = $(event.target).closest("a");
                var targetHight =  $(target.attr("href")).offset().top
                $('html,body').animate({scrollTop: targetHight - 170}, 800, "easeInOutExpo");
            });
        }
    });

});
