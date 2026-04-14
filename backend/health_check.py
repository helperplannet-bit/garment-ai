import socket
import sys
import requests
import time

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def get_sd_status():
    try:
        r = requests.get("http://127.0.0.1:7860/sdapi/v1/options", timeout=2)
        return r.status_code == 200
    except:
        return False

def main():
    services = [
        {"name": "Backend (FastAPI)", "host": "127.0.0.1", "port": 8000, "fix": "Check if start-backend.bat is running and check backend/logs for errors."},
        {"name": "Frontend (React)", "host": "127.0.0.1", "port": 3000, "fix": "Run 'npm start' in the frontend directory."},
        {"name": "Stable Diffusion", "host": "127.0.0.1", "port": 7860, "fix": "Launch AUTOMATIC1111 with --api flag."},
    ]

    print("\n" + "="*40)
    print("   GAFS v1 SYSTEM HEALTH CHECK")
    print("="*40 + "\n")

    all_ok = True
    for s in services:
        status = check_port(s["host"], s["port"])
        if s["port"] == 7860 and status:
            status = get_sd_status()
        
        icon = " [OK] " if status else " [FAIL]"
        print(f"{icon} {s['name']:20} -> {'Online' if status else 'OFFLINE'}")
        if not status:
            print(f"      Suggestion: {s['fix']}")
            all_ok = False
    
    print("\n" + "="*40)
    if all_ok:
        print("   ALL SYSTEMS ARE GREEN!")
    else:
        print("   SOME SYSTEMS ARE DOWN. CHECK ABOVE.")
    print("="*40 + "\n")
    
    if not all_ok:
        sys.exit(1)

if __name__ == "__main__":
    main()
