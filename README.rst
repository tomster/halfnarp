Halfnarp
--------

A simple REST-based companion to the `frab conference management system <https://github.com/frab/frab>`_ that allows users to register which talks they want to attend in order for the organizers to arrange a schedule (a.k.a. *Fahrplan*) with as few conflicts as possible.

Client usage
============

Clients can perform a ``GET`` request against a given installation at the path ``/-/talkpreferences`` and will receive a JSON list of available talks that they may present to their users. Notably, each entry contains a ``event_id`` value.

A client may then ``POST`` against the same URL with a JSON body consisting of a dictionary with a key ``talk_ids`` which contains one or more of the talk ids received during the ``GET``.

The server will respond with a dictionary containing an entry named ``update_url`` containing a unique id.

Clients can then ``PUT`` against that URL using the same schema of a dictionary with a list of ``talk_ids`` thus updating their user's preference.

Note, that any updates against this URL will **not** update the previous ids but instead completely **replace** them with the new values. I.e. if the user has added another talk to his wishlist, the client must send the entire list, not just the new talk.

If – for some reason – the client can or wants to only remember the *url* but not the vote it has cast, it can retrieve them by issuing a ``GET`` on the URL it received (the same one used for ``PUT``ing updates.)

Admin usage
===========

As administrator you can dump the current votes by running ``bin/export-talks`` which will output a CSV list of all votes (without their ``uid``s or IP hashes) to ``stdout``.


TODO
====

- [ ] log (hashed) IP addresses of Clients
- [ ] deploy onto 31C3 jail
- [ ] create browser based client?

