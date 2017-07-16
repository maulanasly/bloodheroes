from flask_restful import fields
from flask_restful_swagger import swagger


@swagger.model
class Auth(object):

    resource_fields = {
        'session_id': fields.String()
    }
    required = ['session_id']


@swagger.model
class UserAuth(object):

    resource_fields = {
        'username': fields.String(),
        'password': fields.String(),
        'email': fields.String()
    }

    required = ['email', 'password']


@swagger.model
class OAuth2(object):

    resource_fields = {
        'user_info': fields.Raw()
    }
    required = []


@swagger.model
class CrateUser(object):
    """docstring for User"""

    resource_fields = {
        'user_id': fields.String(),
        'email': fields.String(),
        'password': fields.String(),
        'contact': fields.String(),
        'firstname': fields.String(),
        'lastname': fields.String(),
        'photo_url': fields.String(),
        'register_date': fields.Integer(),
        'longitude': fields.Float(),
        'latitude': fields.Float(),
        'gender': fields.String(),
        'blood_type': fields.String(),
        'level': fields.String(),
        'status': fields.Integer()
    }

    required = ['email', 'password', 'firstname']


@swagger.model
class User(object):
    """docstring for User"""

    resource_fields = {
        'user_id': fields.String(),
        'email': fields.String(),
        'contact': fields.String(),
        'firstname': fields.String(),
        'lastname': fields.String(),
        'photo_url': fields.String(),
        'register_date': fields.Integer(),
        'longitude': fields.Float(),
        'latitude': fields.Float(),
        'gender': fields.String(),
        'blood_type': fields.String(),
        'level': fields.String(),
        'status': fields.Integer()
    }

    required = ['email', 'password']


@swagger.model
@swagger.nested(
    users=User.__name__)
class UserList(object):
    """docstring for ClassName"""

    resource_fields = {
        "users": fields.List(fields.Nested(User.resource_fields)),
        "count": fields.Integer()
    }

    required = ['users']


@swagger.model
class RequestDonations(object):
    """docstring for User"""

    resource_fields = {
        'donation_id': fields.Integer(),
        'blood_type': fields.String(),
        'notes': fields.String(),
        'request_date': fields.Integer(),
        'requisite_number': fields.Integer(),
        'user': fields.Raw(),
    }

    required = []


@swagger.model
@swagger.nested(
    users=RequestDonations.__name__)
class RequestDonationsList(object):
    """docstring for ClassName"""

    resource_fields = {
        "donations": fields.List(fields.Nested(RequestDonations.resource_fields)),
        "count": fields.Integer(),
        "requisite_number": fields.Integer()
    }

    required = ['donations']
