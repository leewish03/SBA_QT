import schedule
import time
import subprocess
from datetime import datetime

script_name = "main.py"

def run_script():
    print(f"Running {script_name}")
    os.system(f"python3 {script_name}")

# 매일 오전 5시에 실행
schedule.every().day.at("21:10").do(run_script)

print("Scheduler started. Waiting for the time to execute...")

while True:
    schedule.run_pending()
    time.sleep(1)
