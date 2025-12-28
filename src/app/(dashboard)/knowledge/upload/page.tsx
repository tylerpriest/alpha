'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  FolderOpen,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FileUpload {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

const documentTypes = [
  { value: 'RESEARCH_REPORT', label: 'Research Report' },
  { value: 'MEMO', label: 'Memo' },
  { value: 'PITCH_DECK', label: 'Pitch Deck' },
  { value: 'FINANCIAL_MODEL', label: 'Financial Model' },
  { value: 'TERM_SHEET', label: 'Term Sheet' },
  { value: 'LEGAL_DOC', label: 'Legal Document' },
  { value: 'TRANSCRIPT', label: 'Transcript' },
  { value: 'OTHER', label: 'Other' },
];

const acceptedTypes = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📑';
    default:
      return '📎';
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [documentType, setDocumentType] = useState('OTHER');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Simulate upload for each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Update to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress } : f
          )
        );
      }

      // Update to processing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'processing' } : f
        )
      );

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update to complete
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'complete' } : f
        )
      );
    }

    setIsUploading(false);

    // Redirect after all uploads complete
    setTimeout(() => {
      router.push('/knowledge');
    }, 1500);
  };

  const pendingFiles = files.filter((f) => f.status !== 'complete' && f.status !== 'error');
  const completedFiles = files.filter((f) => f.status === 'complete');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/knowledge">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
          <p className="text-muted-foreground">
            Add documents to your knowledge base
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse. Supports PDF, Word, Excel, PowerPoint up to 50MB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {files.map((fileUpload) => (
                <div key={fileUpload.id} className="flex items-center gap-4 py-4">
                  <div className="text-2xl">{getFileIcon(fileUpload.file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileUpload.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(fileUpload.file.size)}
                    </p>
                    {fileUpload.status === 'uploading' && (
                      <Progress value={fileUpload.progress} className="h-1 mt-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {fileUpload.status === 'pending' && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {fileUpload.status === 'uploading' && (
                      <Badge variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    {fileUpload.status === 'processing' && (
                      <Badge variant="warning">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {fileUpload.status === 'complete' && (
                      <Badge variant="success">
                        <Check className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    )}
                    {fileUpload.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                    {fileUpload.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(fileUpload.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Options</CardTitle>
            <CardDescription>Configure how these documents should be categorized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Folder (Optional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="deals">Deals</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setFiles([])}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Link href="/knowledge">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleUpload} disabled={isUploading || pendingFiles.length === 0}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {pendingFiles.length} {pendingFiles.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">What happens after upload?</p>
              <p className="text-sm text-muted-foreground">
                Documents are automatically processed, indexed, and made searchable by AI.
                Text is extracted, embeddings are generated, and the content becomes instantly
                queryable through natural language. Most documents are processed within 1-2 minutes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
