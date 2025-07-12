## Docker Buildx

'''bash
docker buildx build --platform linux/amd64,linux/arm64 --push --tag erlichliu/deepclaude:latest --build-arg BUILDKIT_INLINE_CACHE=1 --cache-from=type=registry,ref=erlichliu/deepclaude:latest --cache-to=type=inline .
'''