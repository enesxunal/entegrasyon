import imageUploadedEvent from "../../../protocol/schemas/media.image_uploaded_event.v1.json";
import imageOptimizeRequest from "../../../protocol/schemas/media.image_optimize_request.v1.json";
import imageOptimizeResult from "../../../protocol/schemas/media.image_optimize_result.v1.json";
import imageReplaceRequest from "../../../protocol/schemas/media.image_replace_request.v1.json";
import operationResult from "../../../protocol/schemas/standard.operation_result.v1.json";
import jobGetRequest from "../../../protocol/schemas/standard.job_get_request.v1.json";

export const PROTOCOL_SCHEMAS: Record<string, object> = {
  "media.image_uploaded_event.v1": imageUploadedEvent,
  "media.image_optimize_request.v1": imageOptimizeRequest,
  "media.image_optimize_result.v1": imageOptimizeResult,
  "media.image_replace_request.v1": imageReplaceRequest,
  "standard.operation_result.v1": operationResult,
  "standard.job_get_request.v1": jobGetRequest,
};
