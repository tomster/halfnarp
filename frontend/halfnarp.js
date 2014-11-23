function do_the_halfnarp() {
  var halfnarpAPI     = "talks.json";
  var halfnarpAPIPOST = "/post.txt";

  $.extend($.expr[':'], {
      'containsi': function(elem, i, match, array)
      {
      return (elem.textContent || elem.innerText || '').toLowerCase()
      .indexOf((match[3] || "").toLowerCase()) >= 0;
      }
  });

  $('.submit').click( function() {
    var ids = $('.selected').map( function() {
        return parseInt($(this).attr('event_id'));
      }).get();
    localStorage['31C3-halfnarp'] = ids;
    $.post( halfnarpAPIPOST, JSON.stringify(ids), function( data ) {
      console.log( 'Posted successfully.' );
    });
    console.log( ids );
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

  var selection = localStorage['31C3-halfnarp'];
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
          t.click(function() { $( this ).toggleClass( "selected" ); });
          var d = $( '#' + item.track_id.toString() );
          if( !d.length ) {
            d = $( '#Other' );
          }
          d.append(t);
      });
    });
}

