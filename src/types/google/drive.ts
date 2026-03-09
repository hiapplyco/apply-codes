/** Google Drive API types */

// ================== GOOGLE DRIVE API TYPES ==================

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
  createdTime: string;
  modifiedTime: string;
  version?: string;
  trashed?: boolean;
  starred?: boolean;
  shared?: boolean;
  ownedByMe?: boolean;
  capabilities?: {
    canEdit?: boolean;
    canComment?: boolean;
    canShare?: boolean;
    canCopy?: boolean;
    canDownload?: boolean;
    canDelete?: boolean;
    canRename?: boolean;
    canAddChildren?: boolean;
    canRemoveChildren?: boolean;
    canReadRevisions?: boolean;
    canChangeCopyRequiresWriterPermission?: boolean;
    canMoveItemIntoTeamDrive?: boolean;
    canMoveItemOutOfTeamDrive?: boolean;
    canMoveItemWithinTeamDrive?: boolean;
    canTrash?: boolean;
    canUntrash?: boolean;
  };
  owners?: GoogleDriveUser[];
  lastModifyingUser?: GoogleDriveUser;
  sharingUser?: GoogleDriveUser;
  permissions?: GoogleDrivePermission[];
  permissionIds?: string[];
  hasAugmentedPermissions?: boolean;
  folderColorRgb?: string;
  originalFilename?: string;
  fullFileExtension?: string;
  fileExtension?: string;
  md5Checksum?: string;
  sha1Checksum?: string;
  sha256Checksum?: string;
  copyRequiresWriterPermission?: boolean;
  writersCanShare?: boolean;
  viewedByMe?: boolean;
  viewedByMeTime?: string;
  quotaBytesUsed?: string;
  isAppAuthorized?: boolean;
  thumbnailLink?: string;
  thumbnailVersion?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  hasThumbnail?: boolean;
  spaces?: string[];
  properties?: { [key: string]: string };
  appProperties?: { [key: string]: string };
  explicitlyTrashed?: boolean;
  teamDriveId?: string;
  driveId?: string;
  shortcutDetails?: {
    targetId: string;
    targetMimeType: string;
    targetResourceKey?: string;
  };
  contentRestrictions?: Array<{
    readOnly?: boolean;
    reason?: string;
    type?: string;
    restrictingUser?: GoogleDriveUser;
    restrictionTime?: string;
  }>;
  resourceKey?: string;
  linkShareMetadata?: {
    securityUpdateEligible?: boolean;
    securityUpdateEnabled?: boolean;
  };
}

export interface GoogleDriveUser {
  displayName: string;
  kind: string;
  me?: boolean;
  permissionId: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface GoogleDrivePermission {
  id: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  emailAddress?: string;
  domain?: string;
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  allowFileDiscovery?: boolean;
  displayName?: string;
  photoLink?: string;
  expirationTime?: string;
  teamDrivePermissionDetails?: Array<{
    teamDrivePermissionType: string;
    role: string;
    inherited: boolean;
    inheritedFrom: string;
  }>;
  permissionDetails?: Array<{
    permissionType: string;
    role: string;
    inherited: boolean;
    inheritedFrom: string;
  }>;
  deleted?: boolean;
  kind: string;
  pendingOwner?: boolean;
}

export interface GoogleDriveFileList {
  kind: string;
  incompleteSearch?: boolean;
  nextPageToken?: string;
  files: GoogleDriveFile[];
}

export interface GoogleDriveSearchParams {
  query?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
  fields?: string;
  spaces?: string;
  includeItemsFromAllDrives?: boolean;
  includePermissionsForView?: string;
  supportsAllDrives?: boolean;
  corpora?: string;
  driveId?: string;
  teamDriveId?: string;
}

export interface GoogleDriveCreateParams {
  name: string;
  parents?: string[];
  mimeType?: string;
  description?: string;
  starred?: boolean;
  writersCanShare?: boolean;
  useContentAsIndexableText?: boolean;
  properties?: { [key: string]: string };
  appProperties?: { [key: string]: string };
  copyRequiresWriterPermission?: boolean;
  folderColorRgb?: string;
  originalFilename?: string;
  keepRevisionForever?: boolean;
  ocrLanguage?: string;
  includePermissionsForView?: string;
  ignoreDefaultVisibility?: boolean;
  supportsAllDrives?: boolean;
}

// ================== UTILITY TYPES ==================

export type GoogleMimeType =
  | 'application/vnd.google-apps.document'
  | 'application/vnd.google-apps.spreadsheet'
  | 'application/vnd.google-apps.presentation'
  | 'application/vnd.google-apps.drawing'
  | 'application/vnd.google-apps.form'
  | 'application/vnd.google-apps.folder'
  | 'application/vnd.google-apps.fusiontable'
  | 'application/vnd.google-apps.map'
  | 'application/vnd.google-apps.photo'
  | 'application/vnd.google-apps.site'
  | 'application/vnd.google-apps.script'
  | 'application/vnd.google-apps.shortcut'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'text/plain'
  | 'text/html'
  | 'text/csv'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/bmp'
  | 'image/svg+xml'
  | 'text/markdown'
  | 'video/mp4'
  | 'video/quicktime'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'application/zip'
  | 'application/json';

export type GoogleDriveSpaces = 'drive' | 'appDataFolder' | 'photos';

export type GoogleDriveCorpora = 'user' | 'domain' | 'drive' | 'allDrives';

export type GoogleDriveOrderBy =
  | 'createdTime'
  | 'createdTime desc'
  | 'folder'
  | 'folder desc'
  | 'modifiedByMeTime'
  | 'modifiedByMeTime desc'
  | 'modifiedTime'
  | 'modifiedTime desc'
  | 'name'
  | 'name desc'
  | 'quotaBytesUsed'
  | 'quotaBytesUsed desc'
  | 'recency'
  | 'recency desc'
  | 'sharedWithMeTime'
  | 'sharedWithMeTime desc'
  | 'starred'
  | 'starred desc'
  | 'viewedByMeTime'
  | 'viewedByMeTime desc';

// ================== COMPOSITE TYPES FOR COMMON OPERATIONS ==================

export interface GoogleDriveExportRequest {
  fileId: string;
  mimeType: GoogleMimeType;
}

export interface GoogleDriveWatchRequest {
  fileId: string;
  webhook: {
    address: string;
    type: string;
    id: string;
    token?: string;
    expiration?: string;
  };
}

export interface GoogleDriveWatchResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
}

export interface GoogleDriveRevision {
  id: string;
  mimeType: string;
  modifiedTime: string;
  keepForever?: boolean;
  published?: boolean;
  publishedOutsideDomain?: boolean;
  publishAuto?: boolean;
  lastModifyingUser?: GoogleDriveUser;
  originalFilename?: string;
  md5Checksum?: string;
  size?: string;
  exportLinks?: { [key: string]: string };
}

export interface GoogleDriveRevisionList {
  kind: string;
  nextPageToken?: string;
  revisions: GoogleDriveRevision[];
}

export interface GoogleDriveComment {
  id: string;
  kind: string;
  createdTime: string;
  modifiedTime: string;
  author: GoogleDriveUser;
  htmlContent: string;
  content: string;
  deleted?: boolean;
  resolved?: boolean;
  quotedFileContent?: {
    mimeType: string;
    value: string;
  };
  anchor?: string;
  replies?: GoogleDriveReply[];
}

export interface GoogleDriveReply {
  id: string;
  kind: string;
  createdTime: string;
  modifiedTime: string;
  author: GoogleDriveUser;
  htmlContent: string;
  content: string;
  deleted?: boolean;
  action?: string;
}

export interface GoogleDriveCommentList {
  kind: string;
  nextPageToken?: string;
  comments: GoogleDriveComment[];
}
