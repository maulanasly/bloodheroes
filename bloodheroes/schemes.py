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
        'phone_number': fields.String(),
        'username': fields.String(),
        'firstname': fields.String(),
        'lastname': fields.String(),
        'profile_pict': fields.Raw(),
        'created_at': fields.Integer(),
        'application': fields.String(),
        'user_role': fields.String(),
        'additional_info': fields.Raw(),
    }

    required = ['email', 'password']


@swagger.model
class User(object):
    """docstring for User"""

    resource_fields = {
        'user_id': fields.String(),
        'email': fields.String(),
        'username': fields.String(),
        'firstname': fields.String(),
        'lastname': fields.String(),
        'phone_number': fields.String(),
        'profile_pict': fields.Raw(),
        'user_role': fields.String(),
        'additional_info': fields.Raw(),
    }

    required = ['email']


@swagger.model
@swagger.nested(
    users=User.__name__)
class UserList(object):
    """docstring for ClassName"""

    resource_fields = {
        "users": fields.List(fields.Nested(User.resource_fields))
    }

    required = ['users']


@swagger.model
class RequestDonations(object):
    """docstring for User"""

    resource_fields = {
        'blood_type': fields.String(),
        'notes': fields.String(),
    }

    required = ['blood_type', 'notes']
