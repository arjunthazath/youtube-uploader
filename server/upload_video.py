# upload_video.py
import httplib2
import os
import random
import sys
import time
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from oauth2client.tools import argparser
from google_auth_oauthlib.flow import InstalledAppFlow

httplib2.RETRIES = 1
MAX_RETRIES = 10

RETRIABLE_EXCEPTIONS = (httplib2.HttpLib2Error, IOError, 
                        httplib2.ServerNotFoundError,
                        httplib2.RedirectMissingLocation)

RETRIABLE_STATUS_CODES = [500, 502, 503, 504]

CLIENT_SECRETS_FILE = "client_secrets.json"
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.readonly"
]
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

VALID_PRIVACY_STATUSES = ("public", "private", "unlisted")

def get_authenticated_service():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=YOUTUBE_SCOPES)
    credentials = flow.run_local_server(port=8080, prompt='consent', authorization_prompt_message='')

    return build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, credentials=credentials)

def initialize_upload(youtube, options):
    tags = None
    if options.keywords:
        tags = options.keywords.split(",")

    body = dict(
        snippet=dict(
            title=options.title,
            description=options.description,
            tags=tags,
        ),
        status=dict(
            privacyStatus=options.privacyStatus  # Set video to the chosen privacy status
        )
    )

    insert_request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=MediaFileUpload(options.file, chunksize=-1, resumable=True)
    )

    resumable_upload(insert_request)

def resumable_upload(insert_request):
    response = None
    error = None
    retry = 0
    while response is None:
        try:
            print("Uploading file...")
            status, response = insert_request.next_chunk()
            if response is not None:
                if 'id' in response:
                    print("Video id '%s' was successfully uploaded." % response['id'])
                    # Write success message to a file
                    with open('uploads/success.txt', 'w') as f:
                        f.write(f'Video uploaded successfully. ID: {response["id"]}')
                else:
                    exit("The upload failed with an unexpected response: %s" % response)
        except HttpError as e:
            if e.resp.status in RETRIABLE_STATUS_CODES:
                error = "A retriable HTTP error %d occurred:\n%s" % (e.resp.status, e.content)
            else:
                raise
        except RETRIABLE_EXCEPTIONS as e:
            error = "A retriable error occurred: %s" % e

        if error is not None:
            print(error)
            retry += 1
            if retry > MAX_RETRIES:
                exit("No longer attempting to retry.")

            max_sleep = 2 ** retry
            sleep_seconds = random.random() * max_sleep
            print("Sleeping %f seconds and then retrying..." % sleep_seconds)
            time.sleep(sleep_seconds)

def update_video_privacy(youtube, video_id, privacy_status):
    try:
        # Retrieve the existing video status
        video_response = youtube.videos().list(
            part="status",
            id=video_id
        ).execute()

        if not video_response['items']:
            print(f"No video found with ID {video_id}")
            return

        # Update the privacy status
        video_status = video_response['items'][0]['status']
        video_status['privacyStatus'] = privacy_status

        update_response = youtube.videos().update(
            part="status",
            body={
                "id": video_id,
                "status": video_status
            }
        ).execute()

        print(f"Video privacy status updated to {privacy_status} for video ID {video_id}")

    except HttpError as e:
        print(f"An HTTP error {e.resp.status} occurred:\n{e.content}")

if __name__ == '__main__':
    argparser.add_argument("--file", required=True, help="Video file to upload")
    argparser.add_argument("--title", help="Video title", default="Test Title")
    argparser.add_argument("--description", help="Video description", default="Test Description")
    argparser.add_argument("--category", default="22", help="Numeric video category.")
    argparser.add_argument("--keywords", help="Video keywords, comma separated", default="")
    argparser.add_argument("--privacyStatus", choices=VALID_PRIVACY_STATUSES, default=VALID_PRIVACY_STATUSES[2], help="Video privacy status.")
    argparser.add_argument("--update_privacy", help="Update the privacy status of an existing video", action='store_true')
    argparser.add_argument("--video_id", help="ID of the video to update the privacy status")

    args = argparser.parse_args()

    youtube = get_authenticated_service()

    if args.update_privacy and args.video_id:
        update_video_privacy(youtube, args.video_id, args.privacyStatus)
    else:
        if not os.path.exists(args.file):
            exit("Please specify a valid file using the --file= parameter.")
        try:
            initialize_upload(youtube, args)
        except HttpError as e:
            print("An HTTP error %d occurred:\n%s" % (e.resp.status, e.content))
        
        # Redirect to success page (you can adjust this logic if necessary)
        print("Redirecting to success page...")
        os.system(f"start http://localhost:5000/success?message='Video uploaded successfully'")
