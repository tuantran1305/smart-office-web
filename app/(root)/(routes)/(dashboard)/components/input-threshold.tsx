import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Edit, XCircle } from "lucide-react";
import React, { useCallback } from "react";

interface InputThresholdProps {
  title: string;
  targetKey: string;
  setEdit: any;
  edit: any;
  attribute: any;
  onSave: any;
}

const InputThreshold: React.FC<InputThresholdProps> = ({
  title,
  targetKey,
  setEdit,
  edit,
  attribute,
  onSave,
}) => {
  return (
    <div className="flex justify-start items-center gap-2">
      {title}:{" "}
      {edit.key === targetKey ? (
        <Input
          value={edit.value}
          className="w-[200px] rounded-full"
          type="number"
          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
        />
      ) : (
        <Input
          value={attribute?.[targetKey]}
          className="w-[200px] rounded-full"
          disabled
        />
      )}
      {edit.key === targetKey ? (
        <div className="flex">
          <Button
            variant={"ghost"}
            size={"sm"}
            className="rounded-full"
            onClick={onSave}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant={"ghost"}
            size={"sm"}
            className="rounded-full"
            onClick={() => setEdit({ key: "", value: "" })}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant={"ghost"}
          size={"sm"}
          className="rounded-full"
          onClick={() =>
            setEdit({
              key: targetKey,
              value: attribute?.[targetKey],
            })
          }
        >
          <Edit className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default InputThreshold;
