import schedule
import time
import os

script_name = "main.py"

def run_script():
    print(f"Running {script_name} at scheduled time...")
    os.system(f"python3 {script_name}")

# 매일 5시 스케줄 등록
schedule.every().day.at("05:00").do(run_script)

print("Scheduler started. Waiting for the scheduled time to execute...")

# 무한 루프로 스케줄러 동작
while True:
    schedule.run_pending()
    time.sleep(60)
