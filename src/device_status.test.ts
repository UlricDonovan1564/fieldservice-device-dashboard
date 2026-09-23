import { strict as assert } from "node:assert";
import { workOrderSchema } from "./field_service.ts";

const complete = workOrderSchema.parse({ work_order_id: "WO-1", device_id: "compressor-2", technician_id: "t-4", dispatch_status: "complete", photo_count: 1, follow_up: "schedule calibration" });
assert.equal(complete.dispatch_status, "complete");
assert.throws(() => workOrderSchema.parse({ work_order_id: "WO-1", device_id: "compressor-2", technician_id: "t-4", dispatch_status: "lost", photo_count: 1, follow_up: "call" }));
console.log("device status decision: complete accepted, unknown dispatch rejected");
