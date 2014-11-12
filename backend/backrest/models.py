from sqlalchemy import MetaData, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker
from zope.sqlalchemy import ZopeTransactionExtension

# SQLAlchemy magical incantations:
metadata = MetaData()
db_session = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()
Base.metadata = metadata
Base.query = db_session.query_property()


class TalkPreference(Base):

    __tablename__ = u'talk_preferences'

    id = Column(String, primary_key=True)
    ip_hash = Column(String, primary_key=True)
