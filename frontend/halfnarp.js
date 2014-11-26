function do_the_halfnarp() {
  var halfnarpAPI     = "/-/talkpreferences";
  var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));

  $.extend($.expr[':'], {
      'containsi': function(elem, i, match, array)
      {
      return (elem.textContent || elem.innerText || '').toLowerCase()
      .indexOf((match[3] || "").toLowerCase()) >= 0;
      }
  });

  $('.submit').click( function() {
    var myapi;
    var ids = $('.selected').map( function() {
        return parseInt($(this).attr('event_id'));
      }).get();
    try {
      localStorage['31C3-halfnarp'] = ids;
      myapi = localStorage['31C3-halfnarp-api'];
    } catch(err) {
      alert("Storing your choices locally is forbidden.");
    }
    var request = JSON.stringify({'talk_ids': ids});
    if( !myapi || !myapi.length ) {
      $.post( halfnarpAPI, request, function( data ) {
        $('.info span').text("submitted");
        $('.info').toggleClass( "hidden", false );
        try {
          localStorage['31C3-halfnarp-api'] = data['update_url'];
        } catch(err) {}
      }, 'json' ).fail(function() {
        $('.info span').text("failed :(");
        $('.info').toggleClass( "hidden", false );
      });
    } else {
      $.ajax({
        type: "PUT",
        url: myapi,
        data: request,
        dataType: "json",
      }).done(function(msg) {
        $('.info span').text("updated");
        $('.info').toggleClass( "hidden", false );
      }).fail(function(msg) {
        $('.info span').text("failed");
        $('.info').toggleClass( "hidden", false );
      });
    }
    $('#qrcode').empty();
    $('#qrcode').qrcode({width: 224, height: 224, text: request});
    $('#qrcode').toggleClass( "hidden", false );
  });

  $('#filter').bind("paste cut keypress keydown keyup", function() {
    var cnt = $(this).val();
    if( cnt.length ) {
      $('.event').css('display', 'none');
      $('.event:containsi('+cnt+')').css('display', 'block');
   } else {
      $('.event').css('display', 'block');
   }
  });

  var selection;
  try {
    selection = localStorage['31C3-halfnarp'];
  } catch(err) {
    selection = [];
  }
  $.getJSON( halfnarpAPI, { format: "json" })
    .done(function( data ) {
      $.each( data, function( i, item ) {
          var t = $( '#template' ).clone(true);
          t.attr('event_id', item.event_id.toString());
          t.attr('id', "event_" + item.event_id.toString());
          if( selection && selection.indexOf(item.event_id) != -1 ) {
            t.toggleClass( "selected", true );
          }
          t.find('.title').text(item.title);
          t.find('.speakers').text(item.speakers);
          t.find('.abstract').text(item.abstract);
          t.click( function() {
            /* Transition for touch devices is highlighted => selected => highlighted ... */
            if( isTouch ) {
              if ( $( this ).hasClass( "highlighted" ) ) {
                $( this ).toggleClass( "selected" );
                $('.info').toggleClass( "hidden", true );
              } else {
                $(".highlighted").removeClass("highlighted");
                $( this ).toggleClass( "highlighted", true );
              }
            } else {
              $( this ).toggleClass( "selected" );
              $('.info').toggleClass( "hidden", true );
            }
          });
          var d = $( '#' + item.track_id.toString() );
          if( !d.length ) {
            d = $( '#Other' );
          }
          d.append(t);
      });
    });
}

