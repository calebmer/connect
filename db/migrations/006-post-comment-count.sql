-- Add a table called “comment count” to our post. We will keep this column
-- updated with a trigger.
ALTER TABLE post ADD COLUMN comment_count INT NOT NULL DEFAULT 0;

-- A trigger function that is called whenever we insert, update, or delete a row
-- from the comment table.
CREATE FUNCTION change_post_comment_count() RETURNS TRIGGER AS $$
  BEGIN
    -- If there was an old row (like in `DELETE` and `UPDATE`) we want to
    -- decrement the `comment_count` for the post that the comment was on.
    IF OLD IS NOT NULL AND (NEW IS NULL OR OLD.post_id <> NEW.post_id) THEN
      UPDATE post SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;

    -- If we are creating a new row (like in `INSERT` and `UPDATE`) we want to
    -- increment the `comment_count` for the post the comment was sent to.
    IF NEW IS NOT NULL AND (OLD IS NULL OR OLD.post_id <> NEW.post_id) THEN
      UPDATE post SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;

    -- This is an after trigger so the result doesn’t matter.
    RETURN NULL;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Install our trigger function on the comment table.
  CREATE TRIGGER change_post_comment_count
           AFTER INSERT OR UPDATE OF post_id OR DELETE
              ON comment
        FOR EACH ROW
EXECUTE FUNCTION change_post_comment_count();
