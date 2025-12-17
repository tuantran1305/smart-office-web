import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Edit, XCircle } from "lucide-react";
import React, { useCallback } from "react";

interface InputStringProps {
  title: string;
  targetKey: string;
  setEdit: any;
  edit: any;
  attribute: any;
  onSave: any;
  className?: any;
}

const InputString: React.FC<InputStringProps> = ({
  title,
  targetKey,
  setEdit,
  edit,
  attribute,
  onSave,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex justify-start items-center gap-2 col-span-full",
        className
      )}
    >
      <span className="min-w-[100px]">{title}: </span>
      {edit.key === targetKey ? (
        <Input
          value={edit.value}
          className="w-full rounded-full"
          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
        />
      ) : (
        <Input
          value={attribute?.[targetKey]}
          className="w-full rounded-full"
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

export default InputString;
