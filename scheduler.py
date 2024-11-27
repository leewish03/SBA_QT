import schedule
import time
import subprocess
from datetime import datetime

script_name = "main.py"

def run_script():
    log_file = "main.log"
    with open(log_file, "a") as log:
        log.write(f"\n[{datetime.now()}] Running {script_name}\n")
        try:
            result = subprocess.run(
                ["python", script_name],  
                stdout=subprocess.PIPE,  
                stderr=subprocess.PIPE,   
                text=True                 
            )
            log.write(result.stdout)
            if result.stderr:
                log.write(f"Error:\n{result.stderr}\n")
        except Exception as e:
            log.write(f"Exception: {str(e)}\n")

# 매일 오전 5시에 실행
schedule.every().day.at("05:00").do(run_script)

print("Scheduler started. Waiting for the time to execute...")

while True:
    schedule.run_pending()
    time.sleep(1)