function toggle_grid(whichDay) {
  var vclasses= ['in-list', 'in-calendar onlyday1', 'in-calendar onlyday2', 'in-calendar onlyday3',
                 'in-calendar onlyday4', 'in-calendar alldays'];
  $('body').removeClass('alldays onlyday1 onlyday2 onlyday3 onlyday4 in-list in-calendar');
  if( whichDay < 0 || whichDay > 5 ) return;
  $('body').addClass(vclasses[whichDay]);
}

function distribute_votes(votes) {
  $('.event').each( function( index, element ) {
    var eid = $(element).attr('event_id');
    var abs = votes[eid];
    var klasse = 5000;
    if (abs < 2000) { klasse = 2000; }
    if (abs < 1000) { klasse = 1000; }
    if (abs < 500)  { klasse = 500;  }
    if (abs < 200)  { klasse = 200;  }
    if (abs < 100)  { klasse = 100;  }
    if (abs < 50)   { klasse = 50;  }
    if (abs < 20)   { klasse = 20;  }
    if (abs < 10)   { klasse = 10;  }
    $(element).addClass('class_'+klasse);

    var abselem = document.createElement('div');
    $(abselem).text(''+abs);
    $(abselem).addClass('absval');
    $(abselem).insertBefore(element.firstChild);
  });
}

function display_correlation() {
  var selected = $('.selected');
  if( selected.length == 1 ) {
    selected = selected[0];
    $('.event').each( function( index, element ) {
      mark_correlation(element, selected );
    });
    $('body').addClass('absolute');
  } else {
    alert( "Select exactly one lecture to calculate correlations.");
  }
}

function mark_correlation(dest, comp) {
  var event_id_dest = 1 * $(dest).attr('event_id');
  var event_id_comp = 1 * $(comp).attr('event_id');
  var d = 0, c = 0, cd = 0;
  $.each( $(window.raw_votes), function( i, item ) {
    var x = 0;
    if( item.indexOf(event_id_dest) > -1 ) { ++d; x++;}
    if( item.indexOf(event_id_comp) > -1 ) { ++c; cd+=x; }
  });
  $(dest).find('.absval').text(d + ':' + cd + ':' + Math.round( 100 * cd / d ) + '%:' + Math.round( 100 * cd / c ) + '%' );
}

function mark_avail(el) {
  $(el).toggleClass('unavailable', !check_avail(el, $(el).attr('fullnarp-day'), $(el).attr('fullnarp-time')));
}

function time_to_mins(time) {
  var hour_mins = /(\d\d)(\d\d)/.exec(time);
  if( hour_mins[1] < 9 ) { hour_mins[1] = 24 + hour_mins[1]; }
  return 60 * hour_mins[1] + 1 * hour_mins[2];
}

function check_avail(el, day, time ) {
  var all_available = true;
  var speakers = window.event_speakers[$(el).attr('event_id')];

  if (!speakers)
      return false;

  /* Check availability of all speakers */
  $.each(speakers, function(i,speaker) {

    /* Now if at least one day is set, each missing
       day means unavailable, */
    var have_avails = false, unavail = true;
    $.each(speaker.availabilities,function(j,a) {

      switch( a.day_id ) {
        case 339: if( day != '1' ) { return true; } break;
        case 340: if( day != '2' ) { return true; } break;
        case 341: if( day != '3' ) { return true; } break;
        case 342: if( day != '4' ) { return true; } break;
        default: return true;
      }
      have_avails = true;

      /* We found availability for the day */
      var event_times    = /(\d\d)(\d\d)/.exec(time);
      var event_duration = $(el).attr('fullnarp-duration') / 60;

      var availtime_start = new Date(a.start_date);
      var availtime_end   = new Date(a.end_date);

      /* Check start time, we calculate in minutes since 00:00 */
      var event_start = event_times[1]; 
      var avail_start = availtime_start.getHours();
      var avail_end   = availtime_end.getHours();

      if( avail_start < 9 ) { avail_start = 24 + avail_start; }
      if( avail_end   < 9 ) { avail_end   = 24 + avail_end; }
      if( event_start < 9 ) { event_start = 24 + event_start; }

      var event_start = 60 * event_start + 1 * event_times[2];
      var avail_start = 60 * avail_start + 1 * availtime_start.getMinutes();
      var avail_end   = 60 * avail_end   + 1 * availtime_end.getMinutes();

      if( event_start >= avail_start && event_start + event_duration <= avail_end )
        unavail = false;
    });
    /* If at least one speaker is unavail, check fails */
    if( have_avails && unavail ) {
      all_available = false;
      return false;
    }
  });

  return all_available;
}

/* Needs to be done for each moved and all previously conflicting events */
function mark_conflict(el) {
  var event_start = time_to_mins($(el).attr('fullnarp-time'));
  var event_duration = $(el).attr('fullnarp-duration') / 60;

  var conflict = false;

  /* We do only need to check events in the same room at the same day for conflicts */
  $('.event.day_'+$(el).attr('fullnarp-day')+'.room'+$(el).attr('fullnarp-room')).each(function(index,check_el) {

    if( $(el).attr('event_id') == $(check_el).attr('event_id') ) { return true; }

    var check_start = time_to_mins($(check_el).attr('fullnarp-time'));
    var check_duration = $(check_el).attr('fullnarp-duration') / 60;

    if( check_start < event_start + event_duration &&
        event_start < check_start + check_duration ) {
        $(check_el).addClass('conflict');
        conflict = true;
    }
  });
  $(el).toggleClass('conflict', conflict );
}

/* provide time OR hour + minute, time overrides */
function set_all_attributes(event_id, day, room, time, from_server) {
    var el = $('#'+event_id);
    el.removeClass(function (index, css) {
      return (css.match (/\btime_\S+|day_\S+|room\S+/g) || []).join(' ');
    });
    el.addClass( time + ' ' + day + ' ' + room );
    var li = { 'room': room, 'day': day, 'time': time };
    localStorage[ '33C3-fullnarp-'+event_id ] = JSON.stringify(li);
    el.attr('fullnarp-day',  li['day'].replace('day_',''));
    el.attr('fullnarp-time', li['time'].replace('time_',''));
    el.attr('fullnarp-room', li['room'].replace('room',''));

    if (!from_server) {
       $.getJSON( 'longpoll?lastupdate='+window.lastupdate+'&setevent='+event_id+'&day='+el.attr('fullnarp-day')+'&room='+el.attr('fullnarp-room')+'&time='+el.attr('fullnarp-time')+'&callback=?', { format: 'json' })
           .done(function( data ) {
                /* should process return array */
           })
        }

    /* When moving an element, conflict may have been resolved ... */
    $('.conflict').each(function(index,check) { mark_conflict(check); });
    /* ... or introduced */
    mark_conflict(el);
    mark_avail(el);
}

function getFullnarpData(lastupdate) {
    $.ajax({
        type: "GET",
        // set the destination for the query
        url: 'longpoll?lastupdate='+window.lastupdate+'&callback=?',
        // define JSONP because we're using a different port and/or domain
        dataType: 'jsonp',
        // needs to be set to true to avoid browser loading icons
        async: true,
        cache: false,
        // timeout after 5 minutes
        timeout:30000,
        // process a successful response
        success: function(response) {
            // append the message list with the new message
            $.each(response.data, function(eventid,event_new) {
                set_all_attributes(eventid, 'day_'+event_new['day'], 'room'+event_new['room'], 'time_'+event_new['time'], true )
            });
            // set lastupdate
            window.lastupdate = response.current_version;
            current_version_string = ('00000'+response.current_version).slice(-5);
            $('.version').html('<a href="https://erdgeist.org/halfnarp/versions/fullnarp_'+current_version_string+'.json">Version: '+response.current_version+'</a>')
            // call again in 1 second
            setTimeout('getFullnarpData('+lastupdate+');', 1000);
        },
        // handle error
        error: function(XMLHttpRequest, textStatus, errorThrown){
            // try again in 10 seconds if there was a request error
            setTimeout('getFullnarpData('+lastupdate+');', 10000);
        },
    });
};

function do_the_fullnarp() {
  var halfnarpAPI     = 'talks_33C3.json';
  var fullnarpAPI     = 'votes_33c3.json';
  // var halfnarpAPI  = '/-/talkpreferences';
  var halfnarpPubAPI  = halfnarpAPI + '/public/';
  var myuid, mypid    = new Object();
  var allrooms        = ['1','2','g','6']
  var allminutes      = ['00','15','30','45']
  var allhours        = ['11','12','13','14','15','16','17','18','19','20','21','22','23','00','01'];
  var alldays         = ['1','2','3','4'];
  var votes           = {};
  var voted           = 0;
  window.event_speakers = {};

  /* Add poor man's type ahead filtering */
  $.extend($.expr[':'], {
      'containsi': function(elem, i, match, array)
      {
      return (elem.textContent || elem.innerText || '').toLowerCase()
      .indexOf((match[3] || '').toLowerCase()) >= 0;
      }
  });

  /* Add handler for type ahead search input field */
  $('#filter').bind('paste cut keypress keydown keyup', function() {
    var cnt = $(this).val();
    if( cnt.length ) {
      $('.event').css('display', 'none');
      $('.event:containsi('+cnt+')').css('display', 'block');
   } else {
      $('.event').css('display', 'block');
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

  /* Add callbacks for view selector */
  $('.vlist').click( function() { toggle_grid(0);  });
  $('.vday1').click( function() { toggle_grid(1); });
  $('.vday2').click( function() { toggle_grid(2); });
  $('.vday3').click( function() { toggle_grid(3); });
  $('.vday4').click( function() { toggle_grid(4); });
  $('.vdays').click( function() { toggle_grid(5); });

  $('.vleft').click( function() { $('body').toggleClass('still-left'); });
  $('.vhalf').click( function()  { $('body').toggleClass('absolute'); });
  $('.vcorr').click( display_correlation );
  $('.vlang').click( function() { $('body').toggleClass('languages'); });

  /* Create hour guides */
  $(allhours).each(function(i,hour) {
    var elem = document.createElement('hr');
    $(elem).addClass('guide time_' + hour + '00');
    $('body').append(elem);
    elem = document.createElement('div');
    $(elem).text(hour + '00');
    $(elem).addClass('guide time_' + hour + '00');
    $('body').append(elem);

    $(allminutes).each(function(i,minute) {
        $(allrooms).each(function(i,room) {
            $(alldays).each(function(i,day) {
                elem = document.createElement('div');
                $(elem).addClass('grid time_' + hour + minute + ' day_' + day + ' room' + room );
                $(elem).text( minute );
                $(elem).attr('dropzone','move');
                $('body').append(elem);
                $(elem).on( 'dragover', function (event) {
                    event.preventDefault(); // allows us to drop
                    $(this).addClass('over');
                    return false;
                  });
                $(elem).on( 'dragleave', function (event) { $(this).removeClass('over'); });
                $(elem).on( 'drop', function (event) {
                    event.stopPropagation();
                    set_all_attributes( event.originalEvent.dataTransfer.getData('Text'), 'day_' + day, 'room' + room, 'time_' + hour + minute, false );
                    /* Don't go back to list view on successful drop */
                    $('body').removeClass('was-list');
                    return false;
                  });
            } );
        } );
    } );

  } );

  /* If we've been here before, try to get local preferences. They are authoratative */
  var selection = [], friends = { 'foo': undefined };
  try {
    selection = localStorage['33C3-halfnarp'] || [];
    myuid     = localStorage['33C3-halfnarp-uid'] || '';
    mypid     = localStorage['33C3-halfnarp-pid'] || '';
  } catch(err) {
  }

  /* Fetch list of votes to display */
  $.getJSON( fullnarpAPI, { format: 'json' })
    .done(function( data ) {
      window.raw_votes = data;
      $.each( data, function( i, item ) {

        /* Now we should have a list of event-ids */
        $(item).each(function( i, eventid) {
          votes[eventid] = 1 + (votes[eventid] || 0 );
        } );
      });
      if( ++voted == 2 ) {
        distribute_votes(votes);
        window.lastupdate = 0;
        getFullnarpData(0);
      }
    });

  /* Fetch list of lectures to display */
  $.getJSON( halfnarpAPI, { format: 'json' })
    .done(function( data ) {
      $.each( data, function( i, item ) {
          /* Take copy of hidden event template div and select them, if they're in
             list of previous prereferences */
          var t = $( '#template' ).clone(true);
          var event_id = item.event_id.toString();
          t.addClass('event');
          t.attr('event_id', event_id );
          t.attr('id', 'event_' + event_id )
          t.attr( 'fullnarp-duration', item.duration);
          t.addClass('lang_' + (item.language || 'en'));

          /* Sort textual info into event div */
          t.find('.title').text(item.title);
          t.find('.speakers').text(item.speaker_names);
          t.find('.abstract').append(item.abstract);

          /* Store speakers and their availabilities */
          window.event_speakers[event_id] = item.speakers;

          t.attr('draggable', 'true');
          if( selection && selection.indexOf(item.event_id) != -1 ) {
            t.addClass( 'selected' );
          }

          /* Make the event drag&droppable */
          t.on( "dragstart", function( event, ui ) {
            event.originalEvent.dataTransfer.setData('text/plain', this.id );
            event.originalEvent.dataTransfer.dropEffect = 'move';
            event.originalEvent.dataTransfer.effectAllowed = 'move';
          } );

          /* While dragging make source element small enough to allow
             dropping below its original area */
          t.on( "drag", function( event, ui ) {
            if     ( $('body').hasClass('size-large') )  { height = '50px'; }
            else if( $('body').hasClass('size-medium') ) { height = '30px'; }
            else                                         { height = '20px'; }
            event.target.style.height = height;
            event.target.style.maxHeight = height;
            event.target.style.overflowY = "hidden";

            /* When drag starts in list view, switch to calendar view */
            if( $('body').hasClass('in-list') ) {
                toggle_grid(5);
                $('body').addClass('was-list');
            }
            if( $('body').hasClass('in-drag') ) {
                return;
            }

            $('body').addClass('in-drag');
            /* mark all possible drop points regarding to availability */
            $(allhours).each(function(i,hour) {
                $(allminutes).each(function(i,minute) {
                    $(alldays).each(function(i,day) {
                        $('.grid.day_'+day+'.time_'+hour+minute).toggleClass('possible',check_avail(event.target,day,hour+minute));
                     });
                });
            });

          });
          t.on( "dragend", function( event, ui ) {
            $('.over').removeClass('over');
            event.target.style.height = "";
            event.target.style.maxHeight = "";
            event.target.style.overflowY = "";

            /* We removed in-list and the drop did not succeed. Go back to list view */
            if($('body').hasClass('was-list')) {
              $('body').removeClass('was-list');
              toggle_grid(0);
            }
            $('body').removeClass('in-drag');
            $('.possible').removeClass('possible');
          } );

          var li = JSON.parse( localStorage[ '33C3-fullnarp-event_'+event_id ] || '{}' );
          if( li['room'] ) {
            t.addClass(li['room'] + ' duration_' + item.duration + ' ' + li['day'] + ' ' + li['time'] );
            t.attr('fullnarp-day',  li['day'].replace('day_',''));
            t.attr('fullnarp-time', li['time'].replace('time_',''));
            t.attr('fullnarp-room', li['room'].replace('room',''));
          } else {
              /* start_time: 2014-12-29T21:15:00+01:00" */
              var start_time = new Date(item.start_time);

              var day  = start_time.getDate()-26;
              var hour = start_time.getHours();
              var mins = start_time.getMinutes();

              /* After midnight: sort into yesterday */
              if( hour < 10 ) {
                  day--;
              }

              /* Fix up room for 33c3 */
              room = (item.room_id || '').toString().replace('379','room1').replace('380','room2').replace('381','roomg').replace('382','room6');

              /* Apply attributes to sort events into calendar */
              t.addClass( room + ' duration_' + item.duration + ' day_'+day + ' time_' + (hour<10?'0':'') + hour + '' + (mins<10?'0':'') + mins );
              t.attr('fullnarp-day', day);
              t.attr('fullnarp-time', (hour<10?'0':'') + hour + (mins<10?'0':'') + mins );
              t.attr('fullnarp-room', room.replace('room',''));
          }
          mark_avail(t);

          t.click( function(event) {
            $('body').removeClass('in-drag');
            $( this ).toggleClass('selected');
            $('.info').addClass('hidden');
            event.stopPropagation();
          });

          /* Put new event into DOM tree. Track defaults to 'Other' */
          var track = item.track_id.toString();
          var d = $( '#' + track );
          t.addClass('track_' + track );
          if( !d.length ) {
            d = $( '#Other' );
          }
          d.append(t);
      });

      if( ++voted == 2 ) {
        distribute_votes(votes);
        window.lastupdate = 0;
        getFullnarpData(0);
      }
    });

  $(document).keypress(function(e) {
    $('body').removeClass('in-drag');
    if( $(document.activeElement).is('input') || $(document.activeElement).is('textarea') )
      return;
    switch( e.charCode ) {
      case 115: case 83: /* s */
        var selected = $('.selected');
        if( selected.length != 2 ) return;
        var li1 = JSON.parse( localStorage[ '33C3-fullnarp-'+selected[0].id ] || '{}' );
        var li2 = JSON.parse( localStorage[ '33C3-fullnarp-'+selected[1].id ] || '{}' );
        if( li1['room'] && li2['room'] ) {
          set_all_attributes( $(selected[1]).attr('id'), li1['day'], li1['room'], li1['time'], false );
          set_all_attributes( $(selected[0]).attr('id'), li2['day'], li2['room'], li2['time'], false );
        }
        break;
      case 48: case 94: /* 0 */
        toggle_grid(5);
        break;
      case 49: case 50: case 51: case 52: /* 1-4 */
        toggle_grid(e.charCode-48);
        break;
      case 76: case 108: /* l */
        toggle_grid(0);
        break;
      case 68: case 100: /* d */
        toggle_grid(5);
        break;
      case 73: case 105: /* i */
        $('body').toggleClass('languages');
        break;
      case 65: case 97:  /* a */
      case 72: case 104: /* h */
        $('body').toggleClass('absolute');
        break;
      case 81: case 113: /* q */
        $('.selected').removeClass('selected');
        break;
      case 85: case 117: /* u */
        $('body').toggleClass('still-left');
        break;
      case 67: case 99: /* c */
        display_correlation();
        break;
    }
  });
}
