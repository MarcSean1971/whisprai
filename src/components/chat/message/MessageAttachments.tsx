
import { MessageAttachment } from "./MessageAttachment";

interface MessageAttachmentsProps {
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

// Renders a collection of MessageAttachment(s)
export function MessageAttachments({ attachments, attachment }: MessageAttachmentsProps) {
  if (attachments && attachments.length > 0) {
    return (
      <>
        {attachments.map((file) => (
          <MessageAttachment key={file.url} file={file} />
        ))}
      </>
    );
  }

  if (attachment) {
    return <MessageAttachment file={attachment} />;
  }

  return null;
}
