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
        'blood_type': fields.String(),
        'notes': fields.String(),
    }

    required = ['blood_type', 'notes']

@swagger.model
class BloodTypes(object):
    """docstring for BloodType"""

    resource_fields = {
        'blood_name': fields.String(),
        'resus': fields.Integer(),
    }

    required = ['blood_name', 'resus']

@swagger.model
@swagger.nested(
    blood_types=BloodTypes.__name__)
class BloodTypeList(object):
    """docstring for ClassName"""

    resource_fields = {
        "blood_types": fields.List(fields.Nested(BloodTypes.resource_fields)),
        "count": fields.Integer()
    }

    required = ['blood_types']

@swagger.model
class UserLevels(object):
    """docstring for BloodType"""

    resource_fields = {
        'level_name': fields.String(),
        'user_id': fields.Integer(),
        'score':fields.Integer()
    }

    required = ['level_name', 'user_id']

@swagger.model
@swagger.nested(
    user_levels=UserLevels.__name__)
class UserLevelsList(object):
    """docstring for ClassName"""

    resource_fields = {
        "user_levels": fields.List(fields.Nested(UserLevels.resource_fields)),
        "count": fields.Integer()
    }

    required = ['user_levels']
