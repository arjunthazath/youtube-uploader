import argparse
import httplib2
import os
import random
import sys
import time
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow

httplib2.RETRIES = 1
MAX_RETRIES = 10

RETRIABLE_EXCEPTIONS = (httplib2.HttpLib2Error, IOError,
                        httplib2.ServerNotFoundError,
                        httplib2.RedirectMissingLocation)

RETRIABLE_STATUS_CODES = [500, 502, 503, 504]

CLIENT_SECRETS_FILE = "client_secrets.json"
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

VALID_PRIVACY_STATUSES = ("public", "private", "unlisted")

def get_authenticated_service():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=["https://www.googleapis.com/auth/youtube.force-ssl"])
    credentials = flow.run_local_server(port=8080, prompt='consent', authorization_prompt_message='')

    return build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, credentials=credentials)

def update_video(youtube, video_id, title, description, keywords, privacy_status):
    tags = None
    if keywords:
        tags = keywords.split(",")

    body = {
        "id": video_id,
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": "22"
        },
        "status": {
            "privacyStatus": privacy_status
        }
    }

    update_request = youtube.videos().update(
        part="snippet,status",
        body=body
    )

    try:
        response = update_request.execute()
        print(f"Video updated: {response['id']}")
    except HttpError as e:
        print(f"An HTTP error {e.resp.status} occurred:\n{e.content}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--videoId', required=True, help='ID of the video to update')
    parser.add_argument('--title', required=True, help='Title of the video')
    parser.add_argument('--description', required=True, help='Description of the video')
    parser.add_argument('--keywords', help='Comma separated list of keywords')
    parser.add_argument('--privacyStatus', choices=VALID_PRIVACY_STATUSES, required=True, help='Privacy status of the video')

    args = parser.parse_args()

    youtube = get_authenticated_service()
    try:
        update_video(youtube, args.videoId, args.title, args.description, args.keywords, args.privacyStatus)
    except HttpError as e:
        print(f"An HTTP error {e.resp.status} occurred:\n{e.content}")
