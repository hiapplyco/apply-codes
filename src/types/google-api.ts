/**
 * TypeScript types for Google Drive and Docs API responses
 * 
 * These types provide comprehensive type safety for Google API interactions
 * including Drive file management, Docs content manipulation, and API responses.
 */

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

// ================== GOOGLE DOCS API TYPES ==================

export interface GoogleDocsDocument {
  documentId: string;
  title: string;
  body: GoogleDocsBody;
  headers?: { [key: string]: GoogleDocsHeader };
  footers?: { [key: string]: GoogleDocsFooter };
  footnotes?: { [key: string]: GoogleDocsFootnote };
  documentStyle?: GoogleDocsDocumentStyle;
  namedStyles?: GoogleDocsNamedStyles;
  revisionId?: string;
  suggestionsViewMode?: string;
  inlineObjects?: { [key: string]: GoogleDocsInlineObject };
  lists?: { [key: string]: GoogleDocsList };
  namedRanges?: { [key: string]: GoogleDocsNamedRange };
  positionedObjects?: { [key: string]: GoogleDocsPositionedObject };
}

export interface GoogleDocsBody {
  content: GoogleDocsStructuralElement[];
}

export interface GoogleDocsStructuralElement {
  startIndex: number;
  endIndex: number;
  paragraph?: GoogleDocsParagraph;
  sectionBreak?: GoogleDocsSectionBreak;
  table?: GoogleDocsTable;
  tableOfContents?: GoogleDocsTableOfContents;
}

export interface GoogleDocsParagraph {
  elements: GoogleDocsParagraphElement[];
  paragraphStyle?: GoogleDocsParagraphStyle;
  positionedObjectIds?: string[];
  bullet?: GoogleDocsBullet;
}

export interface GoogleDocsParagraphElement {
  startIndex: number;
  endIndex: number;
  textRun?: GoogleDocsTextRun;
  inlineObjectElement?: GoogleDocsInlineObjectElement;
  pageBreak?: GoogleDocsPageBreak;
  columnBreak?: GoogleDocsColumnBreak;
  footnoteReference?: GoogleDocsFootnoteReference;
  horizontalRule?: GoogleDocsHorizontalRule;
  equation?: GoogleDocsEquation;
  autoText?: GoogleDocsAutoText;
  person?: GoogleDocsPerson;
  richLink?: GoogleDocsRichLink;
}

export interface GoogleDocsTextRun {
  content: string;
  textStyle?: GoogleDocsTextStyle;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
  suggestedTextStyleChanges?: { [key: string]: GoogleDocsSuggestedTextStyle };
}

export interface GoogleDocsTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  smallCaps?: boolean;
  backgroundColor?: GoogleDocsOptionalColor;
  foregroundColor?: GoogleDocsOptionalColor;
  fontSize?: GoogleDocsDimension;
  weightedFontFamily?: GoogleDocsWeightedFontFamily;
  baselineOffset?: string;
  link?: GoogleDocsLink;
}

export interface GoogleDocsOptionalColor {
  color?: GoogleDocsColor;
}

export interface GoogleDocsColor {
  rgbColor?: GoogleDocsRgbColor;
}

export interface GoogleDocsRgbColor {
  red?: number;
  green?: number;
  blue?: number;
}

export interface GoogleDocsDimension {
  magnitude?: number;
  unit?: string;
}

export interface GoogleDocsWeightedFontFamily {
  fontFamily?: string;
  weight?: number;
}

export interface GoogleDocsLink {
  url?: string;
  bookmarkId?: string;
  headingId?: string;
}

export interface GoogleDocsParagraphStyle {
  headingId?: string;
  namedStyleType?: string;
  alignment?: string;
  lineSpacing?: number;
  direction?: string;
  spacingMode?: string;
  spaceAbove?: GoogleDocsDimension;
  spaceBelow?: GoogleDocsDimension;
  borderBetween?: GoogleDocsParagraphBorder;
  borderTop?: GoogleDocsParagraphBorder;
  borderBottom?: GoogleDocsParagraphBorder;
  borderLeft?: GoogleDocsParagraphBorder;
  borderRight?: GoogleDocsParagraphBorder;
  indentFirstLine?: GoogleDocsDimension;
  indentStart?: GoogleDocsDimension;
  indentEnd?: GoogleDocsDimension;
  tabStops?: GoogleDocsTabStop[];
  keepLinesTogether?: boolean;
  keepWithNext?: boolean;
  avoidWidowAndOrphan?: boolean;
  shading?: GoogleDocsShading;
  pageBreakBefore?: boolean;
}

export interface GoogleDocsParagraphBorder {
  color?: GoogleDocsOptionalColor;
  width?: GoogleDocsDimension;
  padding?: GoogleDocsDimension;
  dashStyle?: string;
}

export interface GoogleDocsTabStop {
  offset?: GoogleDocsDimension;
  alignment?: string;
}

export interface GoogleDocsShading {
  backgroundColor?: GoogleDocsOptionalColor;
}

export interface GoogleDocsBullet {
  listId?: string;
  nestingLevel?: number;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsTable {
  rows?: number;
  columns?: number;
  tableRows?: GoogleDocsTableRow[];
  tableStyle?: GoogleDocsTableStyle;
  columnProperties?: GoogleDocsTableColumnProperties[];
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsTableRow {
  startIndex?: number;
  endIndex?: number;
  tableCells?: GoogleDocsTableCell[];
  tableRowStyle?: GoogleDocsTableRowStyle;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsTableCell {
  content?: GoogleDocsStructuralElement[];
  tableCellStyle?: GoogleDocsTableCellStyle;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsTableStyle {
  tableColumnProperties?: GoogleDocsTableColumnProperties[];
}

export interface GoogleDocsTableColumnProperties {
  width?: GoogleDocsDimension;
  widthType?: string;
}

export interface GoogleDocsTableRowStyle {
  minRowHeight?: GoogleDocsDimension;
  preventOverflow?: boolean;
  tableHeader?: boolean;
}

export interface GoogleDocsTableCellStyle {
  rowSpan?: number;
  columnSpan?: number;
  backgroundColor?: GoogleDocsOptionalColor;
  borderLeft?: GoogleDocsTableCellBorder;
  borderRight?: GoogleDocsTableCellBorder;
  borderTop?: GoogleDocsTableCellBorder;
  borderBottom?: GoogleDocsTableCellBorder;
  paddingLeft?: GoogleDocsDimension;
  paddingRight?: GoogleDocsDimension;
  paddingTop?: GoogleDocsDimension;
  paddingBottom?: GoogleDocsDimension;
  contentAlignment?: string;
}

export interface GoogleDocsTableCellBorder {
  color?: GoogleDocsOptionalColor;
  width?: GoogleDocsDimension;
  dashStyle?: string;
}

// ================== GOOGLE DOCS BATCH UPDATE TYPES ==================

export interface GoogleDocsBatchUpdateRequest {
  requests: GoogleDocsRequest[];
  writeControl?: GoogleDocsWriteControl;
}

export interface GoogleDocsRequest {
  insertText?: GoogleDocsInsertTextRequest;
  deleteContentRange?: GoogleDocsDeleteContentRangeRequest;
  replaceAllText?: GoogleDocsReplaceAllTextRequest;
  updateTextStyle?: GoogleDocsUpdateTextStyleRequest;
  updateParagraphStyle?: GoogleDocsUpdateParagraphStyleRequest;
  createParagraphBullets?: GoogleDocsCreateParagraphBulletsRequest;
  deleteParagraphBullets?: GoogleDocsDeleteParagraphBulletsRequest;
  insertInlineImage?: GoogleDocsInsertInlineImageRequest;
  insertPageBreak?: GoogleDocsInsertPageBreakRequest;
  insertTable?: GoogleDocsInsertTableRequest;
  deleteTable?: GoogleDocsDeleteTableRequest;
  insertTableRow?: GoogleDocsInsertTableRowRequest;
  deleteTableRow?: GoogleDocsDeleteTableRowRequest;
  insertTableColumn?: GoogleDocsInsertTableColumnRequest;
  deleteTableColumn?: GoogleDocsDeleteTableColumnRequest;
  replaceImage?: GoogleDocsReplaceImageRequest;
  updateTableCellStyle?: GoogleDocsUpdateTableCellStyleRequest;
  updateTableRowStyle?: GoogleDocsUpdateTableRowStyleRequest;
  updateTableColumnProperties?: GoogleDocsUpdateTableColumnPropertiesRequest;
  createNamedRange?: GoogleDocsCreateNamedRangeRequest;
  deleteNamedRange?: GoogleDocsDeleteNamedRangeRequest;
  createHeader?: GoogleDocsCreateHeaderRequest;
  createFooter?: GoogleDocsCreateFooterRequest;
  deleteHeader?: GoogleDocsDeleteHeaderRequest;
  deleteFooter?: GoogleDocsDeleteFooterRequest;
  updateDocumentStyle?: GoogleDocsUpdateDocumentStyleRequest;
  insertSectionBreak?: GoogleDocsInsertSectionBreakRequest;
  deleteSectionBreak?: GoogleDocsDeleteSectionBreakRequest;
  updateSectionStyle?: GoogleDocsUpdateSectionStyleRequest;
  mergeTableCells?: GoogleDocsMergeTableCellsRequest;
  unmergeTableCells?: GoogleDocsUnmergeTableCellsRequest;
  replaceNamedRangeContent?: GoogleDocsReplaceNamedRangeContentRequest;
  updateAttributes?: GoogleDocsUpdateAttributesRequest;
}

export interface GoogleDocsInsertTextRequest {
  location: GoogleDocsLocation;
  text: string;
}

export interface GoogleDocsDeleteContentRangeRequest {
  range: GoogleDocsRange;
}

export interface GoogleDocsReplaceAllTextRequest {
  containsText: GoogleDocsSubstringMatchCriteria;
  replaceText: string;
  tabsCriteria?: GoogleDocsTabsCriteria;
}

export interface GoogleDocsUpdateTextStyleRequest {
  range?: GoogleDocsRange;
  textStyle: GoogleDocsTextStyle;
  fields: string;
}

export interface GoogleDocsUpdateParagraphStyleRequest {
  range?: GoogleDocsRange;
  paragraphStyle: GoogleDocsParagraphStyle;
  fields: string;
}

export interface GoogleDocsLocation {
  index: number;
  segmentId?: string;
}

export interface GoogleDocsRange {
  startIndex: number;
  endIndex: number;
  segmentId?: string;
}

export interface GoogleDocsSubstringMatchCriteria {
  text: string;
  matchCase?: boolean;
}

export interface GoogleDocsTabsCriteria {
  tabIds?: string[];
}

export interface GoogleDocsWriteControl {
  requiredRevisionId?: string;
  targetRevisionId?: string;
}

// ================== ADDITIONAL SUPPORTING TYPES ==================

export interface GoogleDocsHeader {
  content: GoogleDocsStructuralElement[];
  headerId: string;
}

export interface GoogleDocsFooter {
  content: GoogleDocsStructuralElement[];
  footerId: string;
}

export interface GoogleDocsFootnote {
  content: GoogleDocsStructuralElement[];
  footnoteId: string;
}

export interface GoogleDocsDocumentStyle {
  background?: GoogleDocsBackground;
  pageNumberStart?: number;
  marginTop?: GoogleDocsDimension;
  marginBottom?: GoogleDocsDimension;
  marginRight?: GoogleDocsDimension;
  marginLeft?: GoogleDocsDimension;
  marginHeader?: GoogleDocsDimension;
  marginFooter?: GoogleDocsDimension;
  pageSize?: GoogleDocsSize;
  flipPageOrientation?: boolean;
  useCustomHeaderFooterMargins?: boolean;
  evenPageHeaderId?: string;
  evenPageFooterId?: string;
  firstPageHeaderId?: string;
  firstPageFooterId?: string;
  defaultHeaderId?: string;
  defaultFooterId?: string;
  useEvenPageHeaderFooter?: boolean;
  useFirstPageHeaderFooter?: boolean;
}

export interface GoogleDocsBackground {
  color?: GoogleDocsOptionalColor;
}

export interface GoogleDocsSize {
  height?: GoogleDocsDimension;
  width?: GoogleDocsDimension;
}

export interface GoogleDocsNamedStyles {
  styles: GoogleDocsNamedStyle[];
}

export interface GoogleDocsNamedStyle {
  namedStyleType: string;
  textStyle?: GoogleDocsTextStyle;
  paragraphStyle?: GoogleDocsParagraphStyle;
}

export interface GoogleDocsInlineObject {
  objectId: string;
  inlineObjectProperties?: GoogleDocsInlineObjectProperties;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsInlineObjectProperties {
  embeddedObject?: GoogleDocsEmbeddedObject;
}

export interface GoogleDocsEmbeddedObject {
  title?: string;
  description?: string;
  embeddedObjectBorder?: GoogleDocsEmbeddedObjectBorder;
  size?: GoogleDocsSize;
  marginTop?: GoogleDocsDimension;
  marginBottom?: GoogleDocsDimension;
  marginRight?: GoogleDocsDimension;
  marginLeft?: GoogleDocsDimension;
  linkedContentReference?: GoogleDocsLinkedContentReference;
  imageProperties?: GoogleDocsImageProperties;
}

export interface GoogleDocsEmbeddedObjectBorder {
  color?: GoogleDocsOptionalColor;
  width?: GoogleDocsDimension;
  dashStyle?: string;
  propertyState?: string;
}

export interface GoogleDocsLinkedContentReference {
  sheetsChartReference?: GoogleDocsSheetsChartReference;
}

export interface GoogleDocsSheetsChartReference {
  spreadsheetId: string;
  chartId: number;
}

export interface GoogleDocsImageProperties {
  contentUri?: string;
  sourceUri?: string;
  brightness?: number;
  contrast?: number;
  transparency?: number;
  cropProperties?: GoogleDocsCropProperties;
  angle?: number;
}

export interface GoogleDocsCropProperties {
  offsetLeft?: number;
  offsetRight?: number;
  offsetTop?: number;
  offsetBottom?: number;
  angle?: number;
}

export interface GoogleDocsList {
  listId: string;
  listProperties?: GoogleDocsListProperties;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsListProperties {
  nestingLevels?: GoogleDocsNestingLevel[];
}

export interface GoogleDocsNestingLevel {
  bulletAlignment?: string;
  glyphFormat?: string;
  glyphSymbol?: string;
  glyphType?: string;
  indentFirstLine?: GoogleDocsDimension;
  indentStart?: GoogleDocsDimension;
  textStyle?: GoogleDocsTextStyle;
  startNumber?: number;
}

export interface GoogleDocsNamedRange {
  namedRangeId: string;
  name: string;
  ranges: GoogleDocsRange[];
}

export interface GoogleDocsPositionedObject {
  objectId: string;
  positionedObjectProperties?: GoogleDocsPositionedObjectProperties;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsPositionedObjectProperties {
  positioning?: GoogleDocsPositionedObjectPositioning;
  embeddedObject?: GoogleDocsEmbeddedObject;
}

export interface GoogleDocsPositionedObjectPositioning {
  layout?: string;
  leftOffset?: GoogleDocsDimension;
  topOffset?: GoogleDocsDimension;
}

// ================== ADDITIONAL PARAGRAPH ELEMENT TYPES ==================

export interface GoogleDocsInlineObjectElement {
  inlineObjectId: string;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsPageBreak {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsColumnBreak {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsFootnoteReference {
  footnoteId: string;
  footnoteNumber: string;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsHorizontalRule {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsEquation {
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsAutoText {
  type?: string;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsPerson {
  personId: string;
  personProperties?: GoogleDocsPersonProperties;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsPersonProperties {
  name?: string;
  email?: string;
}

export interface GoogleDocsRichLink {
  richLinkId: string;
  richLinkProperties?: GoogleDocsRichLinkProperties;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsRichLinkProperties {
  title?: string;
  uri?: string;
  mimeType?: string;
}

export interface GoogleDocsSectionBreak {
  sectionStyle?: GoogleDocsSectionStyle;
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsSectionStyle {
  columnSeparatorStyle?: string;
  contentDirection?: string;
  sectionType?: string;
  defaultHeaderId?: string;
  defaultFooterId?: string;
  evenPageHeaderId?: string;
  evenPageFooterId?: string;
  firstPageHeaderId?: string;
  firstPageFooterId?: string;
  useFirstPageHeaderFooter?: boolean;
  columnProperties?: GoogleDocsSectionColumnProperties[];
  marginTop?: GoogleDocsDimension;
  marginBottom?: GoogleDocsDimension;
  marginRight?: GoogleDocsDimension;
  marginLeft?: GoogleDocsDimension;
  marginHeader?: GoogleDocsDimension;
  marginFooter?: GoogleDocsDimension;
  pageNumberStart?: number;
  flipPageOrientation?: boolean;
}

export interface GoogleDocsSectionColumnProperties {
  width?: GoogleDocsDimension;
  paddingEnd?: GoogleDocsDimension;
}

export interface GoogleDocsTableOfContents {
  content: GoogleDocsStructuralElement[];
  suggestedInsertionIds?: string[];
  suggestedDeletionIds?: string[];
}

export interface GoogleDocsSuggestedTextStyle {
  textStyle?: GoogleDocsTextStyle;
  textStyleSuggestionState?: GoogleDocsTextStyleSuggestionState;
}

export interface GoogleDocsTextStyleSuggestionState {
  boldSuggested?: boolean;
  italicSuggested?: boolean;
  underlineSuggested?: boolean;
  strikethroughSuggested?: boolean;
  smallCapsSuggested?: boolean;
  backgroundColorSuggested?: boolean;
  foregroundColorSuggested?: boolean;
  fontSizeSuggested?: boolean;
  weightedFontFamilySuggested?: boolean;
  baselineOffsetSuggested?: boolean;
  linkSuggested?: boolean;
}

// ================== BATCH UPDATE REQUEST TYPES ==================

export interface GoogleDocsCreateParagraphBulletsRequest {
  range: GoogleDocsRange;
  bulletPreset?: string;
}

export interface GoogleDocsDeleteParagraphBulletsRequest {
  range: GoogleDocsRange;
}

export interface GoogleDocsInsertInlineImageRequest {
  location: GoogleDocsLocation;
  uri: string;
  objectSize?: GoogleDocsSize;
}

export interface GoogleDocsInsertPageBreakRequest {
  location: GoogleDocsLocation;
}

export interface GoogleDocsInsertTableRequest {
  location: GoogleDocsLocation;
  rows: number;
  columns: number;
}

export interface GoogleDocsDeleteTableRequest {
  tableRange: GoogleDocsTableRange;
}

export interface GoogleDocsTableRange {
  tableCellLocation: GoogleDocsTableCellLocation;
  rowSpan?: number;
  columnSpan?: number;
}

export interface GoogleDocsTableCellLocation {
  tableStartLocation: GoogleDocsLocation;
  rowIndex: number;
  columnIndex: number;
}

export interface GoogleDocsInsertTableRowRequest {
  tableCellLocation: GoogleDocsTableCellLocation;
  insertBelow?: boolean;
}

export interface GoogleDocsDeleteTableRowRequest {
  tableCellLocation: GoogleDocsTableCellLocation;
}

export interface GoogleDocsInsertTableColumnRequest {
  tableCellLocation: GoogleDocsTableCellLocation;
  insertRight?: boolean;
}

export interface GoogleDocsDeleteTableColumnRequest {
  tableCellLocation: GoogleDocsTableCellLocation;
}

export interface GoogleDocsReplaceImageRequest {
  imageObjectId: string;
  uri: string;
  imageReplaceMethod?: string;
}

export interface GoogleDocsUpdateTableCellStyleRequest {
  tableRange: GoogleDocsTableRange;
  tableCellStyle: GoogleDocsTableCellStyle;
  fields: string;
}

export interface GoogleDocsUpdateTableRowStyleRequest {
  tableRange: GoogleDocsTableRange;
  tableRowStyle: GoogleDocsTableRowStyle;
  fields: string;
}

export interface GoogleDocsUpdateTableColumnPropertiesRequest {
  tableStartLocation: GoogleDocsLocation;
  columnIndices: number[];
  tableColumnProperties: GoogleDocsTableColumnProperties;
  fields: string;
}

export interface GoogleDocsCreateNamedRangeRequest {
  name: string;
  range: GoogleDocsRange;
}

export interface GoogleDocsDeleteNamedRangeRequest {
  name?: string;
  namedRangeId?: string;
}

export interface GoogleDocsCreateHeaderRequest {
  sectionBreakLocation: GoogleDocsLocation;
  type: string;
}

export interface GoogleDocsCreateFooterRequest {
  sectionBreakLocation: GoogleDocsLocation;
  type: string;
}

export interface GoogleDocsDeleteHeaderRequest {
  headerId: string;
}

export interface GoogleDocsDeleteFooterRequest {
  footerId: string;
}

export interface GoogleDocsUpdateDocumentStyleRequest {
  documentStyle: GoogleDocsDocumentStyle;
  fields: string;
}

export interface GoogleDocsInsertSectionBreakRequest {
  location: GoogleDocsLocation;
  sectionType: string;
}

export interface GoogleDocsDeleteSectionBreakRequest {
  range: GoogleDocsRange;
}

export interface GoogleDocsUpdateSectionStyleRequest {
  range: GoogleDocsRange;
  sectionStyle: GoogleDocsSectionStyle;
  fields: string;
}

export interface GoogleDocsMergeTableCellsRequest {
  tableRange: GoogleDocsTableRange;
}

export interface GoogleDocsUnmergeTableCellsRequest {
  tableRange: GoogleDocsTableRange;
}

export interface GoogleDocsReplaceNamedRangeContentRequest {
  namedRangeId?: string;
  namedRangeName?: string;
  text: string;
}

export interface GoogleDocsUpdateAttributesRequest {
  range: GoogleDocsRange;
  attributes: GoogleDocsAttributes;
  fields: string;
}

export interface GoogleDocsAttributes {
  [key: string]: unknown;
}

// ================== RESPONSE TYPES ==================

export interface GoogleDocsBatchUpdateResponse {
  documentId: string;
  replies: GoogleDocsReply[];
  writeControl?: GoogleDocsWriteControl;
}

export interface GoogleDocsReply {
  createNamedRange?: GoogleDocsCreateNamedRangeReply;
  createHeader?: GoogleDocsCreateHeaderReply;
  createFooter?: GoogleDocsCreateFooterReply;
  insertInlineImage?: GoogleDocsInsertInlineImageReply;
  insertInlineSheetsChart?: GoogleDocsInsertInlineSheetsChartReply;
  replaceAllText?: GoogleDocsReplaceAllTextReply;
  createParagraphBullets?: GoogleDocsCreateParagraphBulletsReply;
  insertTable?: GoogleDocsInsertTableReply;
  insertTableRow?: GoogleDocsInsertTableRowReply;
  insertTableColumn?: GoogleDocsInsertTableColumnReply;
  insertPageBreak?: GoogleDocsInsertPageBreakReply;
  insertSectionBreak?: GoogleDocsInsertSectionBreakReply;
  replaceImage?: GoogleDocsReplaceImageReply;
}

export interface GoogleDocsCreateNamedRangeReply {
  namedRangeId: string;
}

export interface GoogleDocsCreateHeaderReply {
  headerId: string;
}

export interface GoogleDocsCreateFooterReply {
  footerId: string;
}

export interface GoogleDocsInsertInlineImageReply {
  objectId: string;
}

export interface GoogleDocsInsertInlineSheetsChartReply {
  objectId: string;
}

export interface GoogleDocsReplaceAllTextReply {
  occurrencesChanged: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsCreateParagraphBulletsReply {
  // Empty response - intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsInsertTableReply {
  // Empty response - intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsInsertTableRowReply {
  // Empty response - intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsInsertTableColumnReply {
  // Empty response - intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsInsertPageBreakReply {
  // Empty response - intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsInsertSectionBreakReply {
  // Empty response - intentionally empty
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GoogleDocsReplaceImageReply {
  // Empty response - intentionally empty
}

// ================== ERROR TYPES ==================

export interface GoogleApiError {
  code: number;
  message: string;
  status: string;
  details?: Array<{
    '@type': string;
    [key: string]: unknown;
  }>;
}

export interface GoogleApiErrorResponse {
  error: GoogleApiError;
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

export type GoogleDocsNamedStyleType = 
  | 'NORMAL_TEXT'
  | 'TITLE'
  | 'SUBTITLE'
  | 'HEADING_1'
  | 'HEADING_2'
  | 'HEADING_3'
  | 'HEADING_4'
  | 'HEADING_5'
  | 'HEADING_6';

export type GoogleDocsAlignment = 
  | 'ALIGNMENT_UNSPECIFIED'
  | 'START'
  | 'CENTER'
  | 'END'
  | 'JUSTIFIED';

export type GoogleDocsSpacingMode = 
  | 'SPACING_MODE_UNSPECIFIED'
  | 'NEVER_COLLAPSE'
  | 'COLLAPSE_LISTS';

export type GoogleDocsDirection = 
  | 'CONTENT_DIRECTION_UNSPECIFIED'
  | 'LEFT_TO_RIGHT'
  | 'RIGHT_TO_LEFT';

export type GoogleDocsBulletGlyphType = 
  | 'GLYPH_TYPE_UNSPECIFIED'
  | 'NONE'
  | 'DECIMAL'
  | 'ZERO_DECIMAL'
  | 'UPPER_ALPHA'
  | 'ALPHA'
  | 'UPPER_ROMAN'
  | 'ROMAN';

export type GoogleDocsDashStyle = 
  | 'DASH_STYLE_UNSPECIFIED'
  | 'SOLID'
  | 'DOT'
  | 'DASH';

export type GoogleDocsBaselineOffset = 
  | 'BASELINE_OFFSET_UNSPECIFIED'
  | 'NONE'
  | 'SUPERSCRIPT'
  | 'SUBSCRIPT';

export type GoogleDocsWidthType = 
  | 'WIDTH_TYPE_UNSPECIFIED'
  | 'EVENLY_DISTRIBUTED'
  | 'FIXED_WIDTH';

export type GoogleDocsTabAlignment = 
  | 'TAB_ALIGNMENT_UNSPECIFIED'
  | 'START'
  | 'CENTER'
  | 'END';

export type GoogleDocsTableCellContentAlignment = 
  | 'CONTENT_ALIGNMENT_UNSPECIFIED'
  | 'CONTENT_ALIGNMENT_UNSUPPORTED'
  | 'TOP'
  | 'MIDDLE'
  | 'BOTTOM';

export type GoogleDocsSectionType = 
  | 'SECTION_TYPE_UNSPECIFIED'
  | 'CONTINUOUS'
  | 'NEXT_PAGE';

export type GoogleDocsColumnSeparatorStyle = 
  | 'COLUMN_SEPARATOR_STYLE_UNSPECIFIED'
  | 'NONE'
  | 'BETWEEN_EACH_COLUMN';

export type GoogleDocsHeaderFooterType = 
  | 'HEADER_FOOTER_TYPE_UNSPECIFIED'
  | 'DEFAULT'
  | 'FIRST_PAGE'
  | 'EVEN_PAGE';

export type GoogleDocsPositionedObjectLayout = 
  | 'POSITIONED_OBJECT_LAYOUT_UNSPECIFIED'
  | 'WRAP_TEXT'
  | 'BREAK_LEFT'
  | 'BREAK_RIGHT'
  | 'BREAK_LEFT_RIGHT'
  | 'IN_FRONT_OF_TEXT'
  | 'BEHIND_TEXT';

export type GoogleDocsImageReplaceMethod = 
  | 'IMAGE_REPLACE_METHOD_UNSPECIFIED'
  | 'CENTER_CROP';

export type GoogleDocsAutoTextType = 
  | 'TYPE_UNSPECIFIED'
  | 'PAGE_NUMBER'
  | 'PAGE_COUNT';

export type GoogleDocsBulletPreset = 
  | 'BULLET_GLYPH_PRESET_UNSPECIFIED'
  | 'BULLET_DISC_CIRCLE_SQUARE'
  | 'BULLET_DIAMONDX_ARROW3D_SQUARE'
  | 'BULLET_CHECKBOX'
  | 'BULLET_ARROW_DIAMOND_DISC'
  | 'BULLET_STAR_CIRCLE_SQUARE'
  | 'BULLET_ARROW3D_CIRCLE_SQUARE'
  | 'BULLET_LEFTTRIANGLE_DIAMOND_DISC'
  | 'BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE'
  | 'BULLET_DIAMOND_CIRCLE_SQUARE'
  | 'NUMBERED_DECIMAL_ALPHA_ROMAN'
  | 'NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS'
  | 'NUMBERED_DECIMAL_NESTED'
  | 'NUMBERED_UPPERALPHA_ALPHA_ROMAN'
  | 'NUMBERED_UPPERROMAN_UPPERALPHA_DECIMAL'
  | 'NUMBERED_ZERODECIMAL_ALPHA_ROMAN';

// ================== COMPOSITE TYPES FOR COMMON OPERATIONS ==================

export interface GoogleDocsCreateDocumentRequest {
  title?: string;
}

export interface GoogleDocsCreateDocumentResponse {
  documentId: string;
  title: string;
  body: GoogleDocsBody;
  revisionId: string;
}

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

// ================== HELPER TYPES FOR COMMON PATTERNS ==================

export interface GoogleApiClientOptions {
  accessToken?: string;
  apiKey?: string;
  scopes?: string[];
  serviceAccountCredentials?: Record<string, unknown>;
}

export interface GoogleApiRequestOptions {
  fields?: string;
  pageToken?: string;
  pageSize?: number;
  timeout?: number;
  retries?: number;
}

export interface GoogleApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  config: unknown;
}

export interface GoogleApiListResponse<T> {
  items: T[];
  nextPageToken?: string;
  kind: string;
}

export interface GoogleApiOperation {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  progress?: number;
  error?: GoogleApiError;
  response?: unknown;
  metadata?: unknown;
}

export interface GoogleApiQuota {
  limit: number;
  usage: number;
  remaining: number;
  resetTime?: string;
}

export interface GoogleApiRateLimit {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface GoogleApiUsage {
  quota: GoogleApiQuota;
  rateLimit: GoogleApiRateLimit;
  billing?: {
    enabled: boolean;
    costPerRequest: number;
    currency: string;
  };
}