from werkzeug.local import LocalProxy
from functools import wraps
from flask import request, g, current_app
from bloodheroes.models.authentications import Authentication
from bloodheroes import mongo
from bloodheroes.exceptions import MissingSessionID, MissingAppToken, \
    AccessUserPermissionDenied


try:
    from flask import _app_ctx_stack as stack
except ImportError:
    from flask import _request_ctx_stack as stack


def required_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        session_id = request.headers.get('X-SESSION-ID', None)
        do_auth = Authentication()
        if session_id is None:
            raise MissingSessionID
        else:
            session = do_auth.validate_session(session_id)
        app_token = request.headers.get('X-APP-TOKEN', None)
        if app_token is None:
            raise MissingAppToken
        else:
            do_auth.validate_token(app_token)
        ctx = stack.top
        ctx.login_user = session.user.view()
        if not hasattr(g, '_session'):
            g._session = []
        g._session = session.__dict__
        return f(*args, **kwargs)
    return decorated


def required_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        app_token = request.headers.get('X-APP-TOKEN', None)
        do_auth = Authentication()
        if app_token is None:
            raise MissingAppToken
        else:
            do_auth.validate_token(app_token)
        return f(*args, **kwargs)
    return decorated


def _get_login_user():
    ctx = stack.top
    return getattr(ctx, 'login_user', None)


current_user = LocalProxy(lambda: _get_login_user())
