function toggle_grid(whichDay) {
  var vclasses= ['in-list', 'in-calendar onlyday1', 'in-calendar onlyday2', 'in-calendar onlyday3',
                 'in-calendar onlyday4', 'in-calendar alldays'];
  $('body').removeClass('alldays onlyday1 onlyday2 onlyday3 onlyday4 in-list in-calendar');
  if( whichDay < 0 || whichDay > 5 ) return;
  $('body').addClass(vclasses[whichDay]);
  $('#qrcode').toggleClass('limit', whichDay == 0 );
}

function toggle_corr_mode() {
  if ($('body').hasClass('correlate')) {
    $('body').removeClass('correlate');
 } else {
    $('body').removeClass('all-tracks languages classifiers');
    $('body').addClass('correlate');
    $('.event').attr('corr','');
  }
}

function toggle_classifier(classifier, is_track, is_range) {
  if ($('body').hasClass('classifiers') && $('body').attr('classifier') == classifier) {
    $('body').removeClass('classifiers');
    return;
  }
  var default_intensity = 0, prefix = '';
  if (is_range) {
    default_intensity = 5;
    prefix = '+';
  }
  is_range = is_range ? '+' : '';
  for(ev in window.top.all_events) {
    ev = all_events[ev];
    if (ev.event_classifiers) {
      var intensity = default_intensity;
      // if track selector and empty, set to 80%
      if (ev.event_classifiers[classifier])
          intensity = Math.round(ev.event_classifiers[classifier] / 10);
      $('#event_'+ev.event_id).attr('intensity', prefix + intensity);
    }
  }
  $('body').addClass('classifiers');
  $('body').removeClass('all-tracks languages correlate');
  $('body').attr('classifier', classifier);
}

function do_the_halfnarp() {
//  var halfnarpAPI      = 'talks_34C3.json';
  var halfnarpAPI     = '/-/talkpreferences';
  var halfnarpCorrs   = 'corr_array_34c3.json';
  var halfnarpPubAPI  = halfnarpAPI + '/public/';
  var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
  window.top.all_events = new Object();
  var myuid, mypid, newfriend = new Object();
  var allhours        = ['11','12','13','14','15','16','17','18','19','20','21','22','23','00','01'];

  /* Add poor man's type ahead filtering */
  $.extend($.expr[':'], {
      'containsi': function(elem, i, match, array)
      {
      return (elem.textContent || elem.innerText || '').toLowerCase()
      .indexOf((match[3] || '').toLowerCase()) >= 0;
      }
  });

  /* Add callback for submit click */
  $('.submit').click( function() {
    var myapi;

    /* Get user's preferences and try to save them locally */
    var ids = $('.selected').map( function() {
        return parseInt($(this).attr('event_id'));
      }).get();
    try {
      localStorage['34C3-halfnarp'] = ids;
      myapi = localStorage.getItem('34C3-halfnarp-api');
      if (myapi) {
        myapi = myapi.replace(/.*?:\//g, "");
        myapi = 'https:/' + myapi.replace(/.*?:\//g, "");
      }
    } catch(err) {
      alert('Storing your choices locally is forbidden.');
    }

    /* Convert preferences to JSON and post them to backend */
    var request = JSON.stringify({'talk_ids': ids});
    if( !myapi || !myapi.length ) {
      /* If we do not have resource URL, post data and get resource */
      $.post( halfnarpAPI, request, function( data ) {
        $('.info').text('submitted');
        $('.info').removeClass('hidden');
        try {
          localStorage['34C3-halfnarp-api'] = data['update_url'];
          localStorage['34C3-halfnarp-pid'] = mypid = data['hashed_uid'];
          localStorage['34C3-halfnarp-uid'] = myuid = data['uid'];
          window.location.hash = mypid;
        } catch(err) {}
      }, 'json' ).fail(function() {
        $('.info').text('failed :(');
        $('.info').removeClass('hidden');
      });
    } else {
      /* If we do have a resource URL, update resource */
      $.ajax({
        type: 'PUT',
        url: myapi,
        data: request,
        dataType: 'json',
      }).done(function(data) {
        localStorage['34C3-halfnarp-uid'] = myuid = data['uid'];
        if( localStorage['34C3-halfnarp-pid'] ) {
            window.location.hash = localStorage['34C3-halfnarp-pid'];
        }
        $('.info').text('updated');
        $('.info').removeClass('hidden');
      }).fail(function(msg) {
        $('.info').text('failed :(');
        $('.info').removeClass('hidden');
      });
    }

    /* Tell QRCode library to update and/or display preferences for Apps */
    $('#qrcode').empty();
    $('#qrcode').qrcode({width: 224, height: 224, text: request});
    $('#qrcode').removeClass('hidden');

    /* Export all preferences in ical events */
    var now = new Date();
    var calendar = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//events.ccc.de//halfnarp//EN\r\nX-WR-TIMEZONE:Europe/Berlin\r\n';
    ids.forEach( function(id) {
      var item = all_events[id];
      var start = new Date(item.start_time);
      calendar += 'BEGIN:VEVENT\r\n';
      calendar += 'UID:'+myuid+item.event_id+'\r\n';
      calendar += 'DTSTAMP:' + now.toISOString().replace(/-|;|:|\./g, '').replace(/...Z$/, 'Z') + '\r\n';
      calendar += 'DTSTART:' + start.toISOString().replace(/-|;|:|\./g, '').replace(/...Z$/, 'Z') + '\r\n';
      calendar += 'DURATION:PT' + item.duration + 'S\r\n';
      calendar += 'LOCATION:' + item.room_name + '\r\n';
      calendar += 'URL:http://events.ccc.de/congress/2016/Fahrplan/events/' + item.event_id + '.html\r\n';
      calendar += 'SUMMARY:' + item.title + '\r\n';
      calendar += 'DESCRIPTION:' + item.abstract.replace(/\n|\r/g, ' ') + '\r\n';
      console.log( 'id:' + id + ' ' + all_events[id] );
      console.log( all_events[id].title );
      calendar += 'END:VEVENT\r\n';
    });
    calendar += 'END:VCALENDAR\r\n';
    $('.export-url-a').attr( 'href', "data:text/calendar;filename=34C3.ics," + encodeURIComponent(calendar) );
    $('.export-url').removeClass( 'hidden' );
  });

  /* Add handler for type ahead search input field */
  $('#filter').bind('paste cut keypress keydown keyup', function() {
    var cnt = $(this).val();
    if( cnt.length ) {
      $('.event,.track').css('display', 'none');
      $('.event:containsi('+cnt+')').css('display', 'initial').parent().css('display', 'initial');
   } else {
      $('.track,.event').css('display', 'initial');
   }
  });

  /* Add click handlers for event div sizers */
  $('.vsmallboxes').click( function() {
    $('body').removeClass('size-medium size-large');
    $('body').addClass('size-small');
  });

  $('.vmediumboxes').click( function() {
    $('body').removeClass('size-small size-large');
    $('body').addClass('size-medium');
  });

  $('.vlargeboxes').click( function() {
    $('body').removeClass('size-small size-medium');
    $('body').addClass('size-large');
  });

  /* Add de-highlighter on touch interface devices */
  if( isTouch ) {
    $('body').click( function() {
      $('.highlighted').removeClass('highlighted');
    });
  }

  /* Add callbacks for view selector */
  $('.vlist').click( function() { toggle_grid(0); });
  $('.vday1').click( function() { toggle_grid(1); });
  $('.vday2').click( function() { toggle_grid(2); });
  $('.vday3').click( function() { toggle_grid(3); });
  $('.vday4').click( function() { toggle_grid(4); });
  $('.vdays').click( function() { toggle_grid(5); });

  $('.vlang').click( function()  { $('body').removeClass('all-tracks correlate classifiers'); $('body').toggleClass('languages'); });
  $('.vtrack').click( function() { $('body').removeClass('languages correlate classifiers'); $('body').toggleClass('all-tracks'); });

  $('.vcorr').click( function() { toggle_corr_mode(); } );
  $('.vclass').click( function() { toggle_classifier( $(this).attr('classifier'), $(this).hasClass('track'), $(this).hasClass('two_poles')); });

  /* Create hour guides */
  $(allhours).each(function(i,hour) {
    var elem = document.createElement('hr');
    $(elem).addClass('guide time_' + hour + '00');
    $('body').append(elem);
    elem = document.createElement('div');
    $(elem).text(hour + '00');
    $(elem).addClass('guide time_' + hour + '00');
    $('body').append(elem);
  });

  /* If we've been here before, try to get local preferences. They are authoratative */
  var selection = [], friends = { 'foo': undefined };
  try {
    selection = localStorage['34C3-halfnarp'] || [];
    friends   = localStorage['34C3-halfnarp-friends'] || { 'foo': undefined };
    myuid     = localStorage['34C3-halfnarp-uid'] || '';
    mypid     = localStorage['34C3-halfnarp-pid'] || '';
  } catch(err) {
  }

  /* Fetch list of lectures to display */
  $.getJSON( halfnarpAPI, { format: 'json' })
    .done(function( data ) {
      $.each( data, function( i, item ) {
          /* Save event to all_events hash */
          all_events[item.event_id] = item;

          /* Take copy of hidden event template div and select them, if they're in
             list of previous prereferences */
          var t = $( '#template' ).clone(true);
          var event_id = item.event_id.toString();
          t.addClass('event ' + ' lang_' + (item.language || 'en'));
          t.attr('event_id', item.event_id.toString());
          t.attr('id', 'event_' + item.event_id.toString());
          if( selection && selection.indexOf(item.event_id) != -1 ) {
            t.addClass( 'selected' );
          }

          /* Sort textual info into event div */
          t.find('.title').text(item.title);
          t.find('.speakers').text(item.speaker_names);
          t.find('.abstract').append(item.abstract);

          /* start_time: 2014-12-29T21:15:00+01:00" */
          var start_time = new Date(item.start_time);

          var day  = start_time.getDate()-26;
          var hour = start_time.getHours();
          var mins = start_time.getMinutes();

          /* After midnight: sort into yesterday */
          if( hour < 10 ) {
            day--;
          }

          /* Fix up room for 34c3 */
          room = (item.room_id || '').toString().replace('414','room1').replace('415','room2').replace('416','roomg').replace('417','room6');

          /* Apply attributes to sort events into calendar */
          t.addClass(room + ' duration_' + item.duration + ' day_'+day + ' time_' + (hour<10?'0':'') + hour + '' + (mins<10?'0':'') + mins);

          t.click( function(event) {
            if ($('body').hasClass('correlate')) {
              mark_corr(parseInt($(this).attr('event_id')));
              event.stopPropagation();
              return;
            }
            /* Transition for touch devices is highlighted => selected => highlighted ... */
            if( isTouch ) {
              if ( $( this ).hasClass('highlighted') ) {
                $( this ).toggleClass('selected');
                $('.info').addClass('hidden');
              } else {
                $('.highlighted').removeClass('highlighted');
                $( this ).addClass('highlighted');
              }
            } else {
              $( this ).toggleClass('selected');
              $('.info').addClass('hidden');
            }
            event.stopPropagation();
          });
          /* Put new event into DOM tree. Track defaults to 'Other' */
          try {
            var track = item.track_id.toString();
          } catch(e) {
            var track = "Other";
          }
          var d = $( '#' + track );
          t.addClass('track_' + track );
          if( !d.length ) {
            d = $( '#Other' );
          }
          d.append(t);
          if( newfriend.pid ) {
            newfriend.prefs.forEach( function( eventid ) {
              $( '#event_' + eventid ).addClass( 'friend' );
            });
          }
      });

      $.getJSON( halfnarpCorrs, { format: 'json' }).done(function(data) { window.top.all_votes = data; });
      toggle_grid(5);

      /* Check for a new friends public uid in location's #hash */
      var shared = window.location.hash;
      shared = shared ? shared.substr(1) : '';
      if( shared.length ) {
        if ( ( friends[shared] ) || ( shared === mypid ) ) {

        } else {
          $.getJSON( halfnarpPubAPI + shared, { format: 'json' })
            .done(function( data ) {
              newfriend.pid      = shared;
              newfriend.prefs    = data.talk_ids;
              newfriend.prefs.forEach( function( eventid ) {
                $( '#event_' + eventid ).addClass( 'friend' );
              });
            });
        }
      }
      // window.location.hash = '';

      /* Update friends cache
      for( var friend in friends ) {
        $.getJSON( halfnarpPubAPI + friends.pid, { format: 'json' })
          .done(function( data ) {
            friend.prefs = data.talk_ids;
            localStorage['34C3-halfnarp-friends'] = friends;
            update_friends();
          });
      }
      */
    });
    $(document).keypress(function(e) {
      if( $(document.activeElement).is('input') || $(document.activeElement).is('textarea') )
        return;
      switch( e.keyCode ) {
        case 48: case 94: /* 0 */
          toggle_grid(5);
          break;
        case 49: case 50: case 51: case 52: /* 1-4 */
          toggle_grid(e.keyCode-48);
          break;
        case 76: case 108: /* l */
          toggle_grid(0);
          break;
        case 68: case 100: /* d */
          toggle_grid(5);
          break;
        case 73: case 105: /* i */
          $('body').removeClass('all-tracks');
          $('body').toggleClass('languages');
          break;
        case 84: case 116: /* t */
          $('body').removeClass('languages');
          $('body').toggleClass('all-tracks');
          break;
        case 67: case 99: /* c */
          toggle_corr_mode();
          break;
        }
    });
}

function mark_corr(eid) {
  /* If JSON with votes is not there, bail */
  if (!all_votes) return;

  /* Reset correlation markers */
  $('.event').attr('corr','');

  /* Get index of reference event id */
  var eoff = all_votes.event_ids.indexOf(eid);
  if (eoff==-1) return;

  $('.event').each(function (i, dest) {
    var destid = parseInt($(dest).attr('event_id'));
    /* mark reference event at another place */
    if (destid == eid) {
      $(dest).attr('corr', 'x');
      return;
    }

    var destoff = all_votes.event_ids.indexOf(destid);
    if (destoff==-1) {
      $(dest).attr('corr','0');
      return;
    }

    /* Only the smaller event-id's string has the info */
    if (eoff < destoff)
      $(dest).attr('corr',all_votes.event_corrs[eoff].charAt(destoff-eoff-1));
    else
      $(dest).attr('corr',all_votes.event_corrs[destoff].charAt(eoff-destoff-1));
  });
}
