-- Before publishVersion archived the previous version (FLOW-02, ait-rcw.9), publishing a
-- prompt version left the older one PUBLISHED as well, so test settings kept offering an
-- outdated version with a different model. Keep only the newest published version of each
-- prompt. Test versions stay bound to whatever prompt version they already use.
UPDATE "analysis_prompt_versions" AS "version"
SET
  "status" = 'ARCHIVED',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "version"."status" = 'PUBLISHED'
  AND EXISTS (
    SELECT 1
    FROM "analysis_prompt_versions" AS "newer"
    WHERE "newer"."promptId" = "version"."promptId"
      AND "newer"."status" = 'PUBLISHED'
      AND "newer"."versionNumber" > "version"."versionNumber"
  );
