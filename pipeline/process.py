#!/usr/bin/env python3
"""Compression pipeline: original -> WebP master (1600px) + thumb (400px).

Because storage economy is a core rule: ~3MB/listing vs ~150MB without
discipline. Originals live only a few minutes in uploads/ then are purged.
"""

import os
import sys
import uuid
from io import BytesIO

import boto3
from PIL import Image

S3_ENDPOINT = os.environ.get("S3_ENDPOINT")
S3_BUCKET = os.environ.get("S3_BUCKET", "manahome-medias")
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY")
S3_REGION = os.environ.get("S3_REGION", "gra")

MAX_EDGE_MASTER = 1600
MAX_EDGE_THUMB = 400
WEBP_QUALITY = 80


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION,
    )


def rescale_webp(image: Image.Image, max_edge: int) -> bytes:
    image = image.convert("RGB")
    w, h = image.size
    if max(w, h) > max_edge:
        ratio = max_edge / max(w, h)
        image = image.resize((round(w * ratio), round(h * ratio)), Image.LANCZOS)
    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY)
    return buffer.getvalue()


def process(s3, original_key: str) -> dict:
    listing_dir = f"annonces/{uuid.uuid4()}"
    obj = s3.get_object(Bucket=S3_BUCKET, Key=original_key)
    with Image.open(obj["Body"]) as image:
        master = rescale_webp(image, MAX_EDGE_MASTER)
        thumb = rescale_webp(image, MAX_EDGE_THUMB)

    master_key = f"{listing_dir}/master.webp"
    thumb_key = f"{listing_dir}/thumb.webp"
    s3.put_object(Bucket=S3_BUCKET, Key=master_key, Body=master, ContentType="image/webp")
    s3.put_object(Bucket=S3_BUCKET, Key=thumb_key, Body=thumb, ContentType="image/webp")

    # The heavy original lives only a few minutes: purge after processing.
    s3.delete_object(Bucket=S3_BUCKET, Key=original_key)

    return {"master": master_key, "thumb": thumb_key}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: process.py <uploads/original-key>")
    print(process(s3_client(), sys.argv[1]))
