/**
 * PixelCraft Multi-Tool Workflow Runner
 * Allows sequential chaining of creative and document tools into automated pipelines.
 */

const PixelCraftWorkflows = {
    async loadPresets() {
        try {
            const res = await PixelCraftAPI.workflows.list();
            return res.workflows || [];
        } catch (err) {
            console.warn('Failed to load workflows:', err);
            return [];
        }
    },

    async runWorkflow(workflowId, steps, initialPayload, onProgress) {
        if (onProgress) onProgress({ step: 1, total: steps.length, status: 'starting' });

        try {
            const res = await PixelCraftAPI.workflows.execute({
                workflowId,
                steps,
                initialPayload
            });

            if (onProgress) onProgress({ step: steps.length, total: steps.length, status: 'completed' });
            return res;
        } catch (err) {
            if (onProgress) onProgress({ status: 'failed', error: err.message });
            throw err;
        }
    }
};

window.PixelCraftWorkflows = PixelCraftWorkflows;

