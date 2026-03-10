export function AiTrainerSync({ page = 'ai-free' }: { page?: 'ai-roles' | 'ai-free' | 'ai-scene' }) {
  return (
    <div
      style={{
        height: 'calc(100vh - 110px)',
        overflow: 'hidden',
        background: 'var(--white)',
      }}
    >
      <iframe
        src={`/NSK-AI-Trainer-3Panel.html?page=${page}&embed=content`}
        title="NSK AI Trainer 3Panel"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}
