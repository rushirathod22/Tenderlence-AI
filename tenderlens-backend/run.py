import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("  TenderLens AI — Multi-Agent Procurement Backend Running")
    print("  API Docs available at: http://localhost:8000/docs")
    print("  Health Check: http://localhost:8000/api/health")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
