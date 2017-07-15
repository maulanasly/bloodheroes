from flask import current_app
from flask_restful import Resource, reqparse, marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import User, CrateUser, UserList
from bloodheroes.helpers.decorators import required_auth, current_user, required_token
from bloodheroes.helpers.utilities import email_validator, encrypt_password, to_timestamp
from bloodheroes.exceptions import FieldRequired, InvalidEmailFormat, EmailConflict,\
    UnIndetifiedAtribute, UserNotFound

from datetime import datetime

add_user_parser = reqparse.RequestParser()
add_user_parser.add_argument('email', type=str)
add_user_parser.add_argument('firstname', type=str)
add_user_parser.add_argument('lastname', type=str)
add_user_parser.add_argument('contact', type=str, default=None)
add_user_parser.add_argument('password', type=str)
add_user_parser.add_argument('fcm_token', type=str, default=None)
add_user_parser.add_argument('photo_url', type=str, default=None)
add_user_parser.add_argument('longitude', type=float, default=0)
add_user_parser.add_argument('latitude', type=float, default=0)
add_user_parser.add_argument('gender', type=str, default='U')
add_user_parser.add_argument('blood_type', type=str, default=None)
add_user_parser.add_argument('level_id', type=int, default=0)
add_user_parser.add_argument('status', type=int, default=1)

update_user_parser = reqparse.RequestParser()
update_user_parser.add_argument('email', type=str)
update_user_parser.add_argument('firstname', type=str)
update_user_parser.add_argument('lastname', type=str)
update_user_parser.add_argument('contact', type=str, default=None)
update_user_parser.add_argument('password', type=str)
update_user_parser.add_argument('fcm_token', type=str, default=None)
update_user_parser.add_argument('photo_url', type=str, default=None)
update_user_parser.add_argument('longitude', type=float, default=0)
update_user_parser.add_argument('latitude', type=float, default=0)
update_user_parser.add_argument('gender', type=str, default='U')
update_user_parser.add_argument('blood_type', type=str, default=None)
update_user_parser.add_argument('level_id', type=int, default=0)
update_user_parser.add_argument('status', type=int, default=0)


get_user_parser = reqparse.RequestParser()
get_user_parser.add_argument('longitude', type=float, default=None)
get_user_parser.add_argument('latitude', type=float, default=None)
get_user_parser.add_argument('distance', type=int, default=1000)
get_user_parser.add_argument('blood_type', type=str, default=None)
get_user_parser.add_argument('gender', type=str, default=None)
get_user_parser.add_argument('status', type=int, default=1)
get_user_parser.add_argument('page', type=int, default=0)
get_user_parser.add_argument('per_page', type=int, default=10)


class UserAPI(Resource):
    """docstring for UserAPI"""
    decorators = [required_auth]

    @swagger.operation(
        notes="""Add new user""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            }
        ],
        responseClass=User.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            FieldRequired.to_swagger(),
            InvalidEmailFormat.to_swagger()
        ]
    )
    @marshal_with(CrateUser.resource_fields)
    def get(self, user_id=None):
        if user_id == 'self':
            user_id = current_user['user_id']
        user = mongo.db.users.find_one({'user_id': user_id})
        if user is None:
            raise UserNotFound(user_id=user_id)
        blood = mongo.db.blood_types.find_one({'blood_id': None if user['blood_id'] is None else int(user['blood_id'])})
        user['blood_type'] = None if blood is None else blood['blood_name']
        user['longitude'] = user['location']['coordinates'][0]
        user['latitude'] = user['location']['coordinates'][1]
        return user

    @swagger.operation(
        notes="""Update user by id""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "user",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": CrateUser.__name__,
                "paramType": "body"
            }
        ],
        responseClass=User.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            UserNotFound.to_swagger()
        ]
    )
    @marshal_with(CrateUser.resource_fields)
    def put(self, user_id=None):
        if user_id == 'self':
            user_id = current_user['user_id']
        user = mongo.db.users.find_one({'user_id': user_id})
        if user is None:
            raise UserNotFound(user_id=user_id)
        args = update_user_parser.parse_args()
        firstname = args['firstname']
        lastname = args['lastname']
        contact = args['contact']
        password = args['password']
        fcm_token = args['fcm_token']
        photo_url = args['photo_url']
        longitude = args['longitude']
        latitude = args['latitude']
        gender = args['gender']
        blood_type = args['blood_type']
        level_id = args['level_id']
        status = args['status']
        blood_id = None
        if blood_type is not None:
            blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
            blood_id = int(blood['blood_id'])
        prepared_data = {
            'firstname': firstname,
            'lastname': lastname,
            'contact': contact,
            'fcm_token': fcm_token,
            'photo_url': photo_url,
            'gender': gender,
            'blood_id': blood_id,
            'level_id': level_id,
            'status': status,
            'location': {
                'type': 'Point',
                'coordinates': [
                    longitude,
                    latitude
                ]
            }
        }
        if password:
            prepared_data['bcrypt_password'] = encrypt_password(password),
        if firstname is None:
            prepared_data.pop('firstname')
        if lastname is None:
            prepared_data.pop('lastname')
        if contact is None:
            prepared_data.pop('contact')
        if fcm_token is None:
            prepared_data.pop('fcm_token')
        if photo_url is None:
            prepared_data.pop('photo_url')
        if gender is None:
            prepared_data.pop('gender')
        if blood_id is None:
            prepared_data.pop('blood_id')
        if level_id is None:
            prepared_data.pop('level_id')
        if status is None:
            prepared_data.pop('status')
        if longitude is None or latitude is None:
            prepared_data.pop('location')
        mongo.db.users.update({'user_id': user_id}, {'$set': prepared_data})
        return 'no content', 204

    @swagger.operation(
        notes="""Delete user by id""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            }
        ],
        responseClass=User.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            FieldRequired.to_swagger(),
            InvalidEmailFormat.to_swagger()
        ]
    )
    @marshal_with(CrateUser.resource_fields)
    def delete(self, user_id=None):
        if user_id == 'self':
            user_id = current_user['user_id']
        user = mongo.db.users.find_one({'user_id': user_id})
        if user is None:
            raise UserNotFound
        mongo.db.users.remove({'user_id': user_id})
        return 'no content', 204


class UserListAPI(Resource):
    """docstring for UserAPI"""
    # decorators = [required_auth]

    @swagger.operation(
        notes="""Get list of user""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "longitude",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "float",
                "paramType": "query"
            },
            {
                "name": "latitude",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "float",
                "paramType": "query"
            },
            {
                "name": "distance",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            },
            {
                "name": "blood_type",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "str",
                "paramType": "query"
            },
            {
                "name": "gender",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "str",
                "paramType": "query"
            },
            {
                "name": "status",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            },
            {
                "name": "page",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "str",
                "paramType": "query"
            },
            {
                "name": "per_page",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            }
        ],
        responseClass=UserList.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            UserNotFound.to_swagger()
        ]
    )
    @marshal_with(UserList.resource_fields)
    @required_auth
    def get(self):
        args = get_user_parser.parse_args()
        longitude = args['longitude']
        latitude = args['latitude']
        distance = args['distance']
        blood_type = args['blood_type']
        status = args['status']
        gender = args['gender']
        page = args['page']
        per_page = args['per_page']
        blood_id = None
        if blood_type is not None:
            blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
            blood_id = None if blood is None else blood['blood_id']
        filters = {}
        if longitude and latitude:
            filters["location"] = {
                "$geoWithin": {
                    "$center": [
                        [longitude, latitude], distance
                    ]
                }
            }
        if blood_id:
            filters['blood_id'] = blood_id
        if gender:
            filters['gender'] = gender
        if status:
            filters['status'] = status
        user_cursor = mongo.db.users.find(filters).skip(((page - 1) * per_page) if page > 0 else 0).limit(per_page)
        user_view = []
        for user in user_cursor:
            blood = mongo.db.blood_types.find_one({'blood_id': None if user['blood_id'] is None else int(user['blood_id'])})
            user['blood_type'] = None if blood is None else blood['blood_name']
            user['longitude'] = user['location']['coordinates'][0]
            user['latitude'] = user['location']['coordinates'][1]
            user_view.append(user)
        return {'users': user_view, 'count': user_cursor.count()}, 200

    @swagger.operation(
        notes="""Add new user""",
        parameters=[
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "user",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": CrateUser.__name__,
                "paramType": "body"
            }
        ],
        responseClass=User.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            FieldRequired.to_swagger(),
            InvalidEmailFormat.to_swagger()
        ]
    )
    @marshal_with(CrateUser.resource_fields)
    @required_token
    def post(self):
        args = add_user_parser.parse_args()
        email = args['email']
        firstname = args['firstname']
        lastname = args['lastname']
        contact = args['contact']
        password = args['password']
        fcm_token = args['fcm_token']
        photo_url = args['photo_url']
        longitude = args['longitude']
        latitude = args['latitude']
        gender = args['gender']
        blood_type = args['blood_type']
        level_id = args['level_id']
        status = args['status']

        if email is None:
            raise FieldRequired(required_field='email')
        if not email_validator(email):
            raise InvalidEmailFormat(email=email, expected='<xxxxxx>@<xxxxx>.<xxx>')
        if firstname is None:
            raise FieldRequired(required_field='firstname')
        if password is None:
            raise FieldRequired(required_field='password')

        if mongo.db.users.find_one({'email': email}):
            raise EmailConflict(email=email)
        blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
        blood_id = None
        if blood_type is not None:
            blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
            blood_id = None if blood is None else blood['blood_id']
        user_cursor = mongo.db.users.find({}).sort([('user_id', -1)]).limit(1)
        last_id = 0
        for user in user_cursor:
            last_id = int(user['user_id'])
        prepared_data = {
            'user_id': last_id + 1,
            'email': email,
            'firstname': firstname,
            'lastname': lastname,
            'contact': contact,
            'bcrypt_password': encrypt_password(password),
            'fcm_token': fcm_token,
            'photo_url': photo_url,
            'gender': gender,
            'blood_id': blood_id,
            'level_id': level_id,
            'status': status,
            'register_date': to_timestamp(datetime.now()),
            'location': {
                'type': 'Point',
                'coordinates': [
                    longitude,
                    latitude
                ]
            }
        }
        mongo.db.users.insert_one(prepared_data)
        return prepared_data, 200
