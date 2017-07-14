from flask import g
from flask_restful import Resource, reqparse, marshal_with
from flask_restful_swagger import swagger
from mallsini.schemes import Auth, UserAuth
from mallsini import mongo
from mallsini.exceptions import UnAuthorized, InvalidFileType, SessionExpired, \
    UserNotFound, IncorrectPassword, InvalidEmailFormat
from mallsini.models.authentications import Authentication
from mallsini.helpers.decorators import required_token, required_auth
from mallsini.helpers.utilities import email_validator


import md5

auth_parser = reqparse.RequestParser()
auth_parser.add_argument('username', type=str, default=None)
auth_parser.add_argument('email', type=str, default=None)
auth_parser.add_argument('password', type=str, default=None)


class AuthAPI(Resource):
    """docstring for AuthAPI"""
    decorators = [required_token]

    @swagger.operation(
        notes="""User authentication method""",
        parameters=[
            {
                "name": "payloads",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": UserAuth.__name__,
                "paramType": "body"
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
        responseClass=Auth.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            UnAuthorized.to_swagger(),
            InvalidFileType.to_swagger(),
            UserNotFound.to_swagger()
        ]
    )
    @marshal_with(Auth.resource_fields)
    def post(self):
        "authenticate user"
        args = auth_parser.parse_args()
        username = args['username']
        email = args['email']
        password = args['password']
        if email is None and username is None:
            raise InvalidFileType
        if username is None:
            if not email_validator(email):
                raise InvalidEmailFormat(email=email, expected='<xxxxxx>@<xxxxx>.<xxx>')
            user = mongo.db.users.find_one({'email': email})
        else:
            user = mongo.db.users.find_one({'username': username})
        if user is not None:
            login = Authentication()
            try:
                session_id = login.do_login(user, password)
            except IncorrectPassword:
                hashed_password = md5.new(password).hexdigest()
                session_id = login.do_login(user, hashed_password)
        else:
            raise UserNotFound
        return {'session_id': session_id}, 200


class SignOutAPI(Resource):
    """docstring for SignOut"""
    decorators = [required_auth]

    @swagger.operation(
        notes="""User authentication method""",
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
        responseClass=Auth.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            SessionExpired.to_swagger(),
            InvalidFileType.to_swagger()
        ]
    )
    @marshal_with(Auth.resource_fields)
    def post(self):
        "user logout"
        if hasattr(g, '_session'):
            session_id = g._session['session_id']
        else:
            raise UnAuthorized
        session = mongo.db.sessions.find_one({'session_id': session_id})
        user = mongo.db.users.find_one({'user_id': session['user_id']})
        if not session:
            raise SessionExpired
        logout = Authentication()
        logout.delete_session_in_cache(user['email'], session.user_id)
        session.delete()
        return 'no content', 204
