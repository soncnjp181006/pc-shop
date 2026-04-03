import sys
with open('debug_out.txt', 'w') as f:
    try:
        from app.main import app
        f.write('App imported successfully!\n')
    except Exception as e:
        import traceback
        f.write('App import FAILED:\n' + traceback.format_exc())
