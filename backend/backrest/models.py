from hashlib import sha1, sha256
from sqlalchemy import MetaData, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker
from uuid import uuid4
from zope.sqlalchemy import ZopeTransactionExtension

# SQLAlchemy magical incantations:
metadata = MetaData()
db_session = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()
Base.metadata = metadata
Base.query = db_session.query_property()


class TalkPreference(Base):

    __tablename__ = u'talk_preferences'

    uid = Column(String, primary_key=True)
    ip_hash = Column(String, index=True)
    talk_ids = Column(ARRAY(Integer))

    def update(self, ip_address=None, talk_ids=None):
        if ip_address is not None:
            self.ip_hash = sha1(ip_address).hexdigest()
        self.talk_ids = talk_ids

    def add(self, uid=None, **kw):
        if uid is None:
            uid = uuid4().hex
        self.uid = uid
        self.update(**kw)
        db_session.add(self)
        db_session.flush()

    def __init__(self, **data):
        self.add(**data)

    @property
    def hashed_uid(self):
        return sha256(self.uid.encode('utf-8')).hexdigest()
