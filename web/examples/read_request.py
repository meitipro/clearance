# Read one request from Python. genlayer-py 0.19.0rc2 reads through an account,
# so a throwaway one is made; it is never funded and never signs.
#   python examples/read_request.py 2
import json
import sys

from genlayer_py import create_account, create_client
from genlayer_py.chains import studio_devnet

# A model's reason can carry any character; a Windows console codepage cannot.
sys.stdout.reconfigure(encoding="utf-8")

CLEARANCE = "0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf"
studio_devnet.rpc_urls = {"default": {"http": ["https://studio-next.genlayer.com/api"]}}
client = create_client(chain=studio_devnet, account=create_account())

request_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
raw = client.read_contract(address=CLEARANCE, function_name="get_request", args=[request_id])
request = json.loads(raw)
if request["found"]:
    print(request["verdict"], request["tier"], request["status"], request["reason"])
else:
    print(f"no request {request_id}")
