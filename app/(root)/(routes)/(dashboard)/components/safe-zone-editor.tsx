"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Edit, Shield } from "lucide-react";
import { useState } from "react";

interface SafeZoneEditorProps {
  safe_zone: any;
  onSave: (newSafeZone: any[]) => void;
  set_zone?: boolean | string;
  onToggleSetZone?: (value: boolean) => void;
}

const SafeZoneEditor: React.FC<SafeZoneEditorProps> = ({ safe_zone, onSave, set_zone, onToggleSetZone }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any[]>([]);

  // Parse safe_zone
  let safeZoneArray: any[] = [];
  if (typeof safe_zone === "string") {
    try {
      safeZoneArray = JSON.parse(safe_zone);
    } catch (e) {
      console.error("Failed to parse safe_zone", e);
    }
  } else if (Array.isArray(safe_zone)) {
    safeZoneArray = safe_zone;
  }

  // Ensure we always have 3 zones
  while (safeZoneArray.length < 3) {
    safeZoneArray.push({ latitude: "", longitude: "", radius: "" });
  }

  const handleEdit = () => {
    setEditData(JSON.parse(JSON.stringify(safeZoneArray))); // Deep clone
    setEditing(true);
  };

  const handleCancel = () => {
    setEditData([]);
    setEditing(false);
  };

  const handleSave = () => {
    onSave(editData);
    setEditing(false);
  };

  const updateField = (index: number, field: string, value: string) => {
    const newData = [...editData];
    newData[index] = { ...newData[index], [field]: value };
    setEditData(newData);
  };

  const displayData = editing ? editData : safeZoneArray;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Vị Trí An Toàn:</h3>
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-muted-foreground">
            Chế Độ An Toàn
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Bật vùng an toàn</span>
            <Switch
              checked={set_zone === true || set_zone === "true"}
              onCheckedChange={(checked) => {
                onToggleSetZone && onToggleSetZone(checked);
              }}
            />
          </div>
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="rounded-full"
            >
              <Edit className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
            >
              Bật
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="text-sm font-medium">Vị Trí 1</div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Kinh Độ 1</div>
            <Input
              type="text"
              value={displayData[0]?.longitude || ""}
              onChange={(e) => updateField(0, "longitude", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Vĩ Độ 1</div>
            <Input
              type="text"
              value={displayData[0]?.latitude || ""}
              onChange={(e) => updateField(0, "latitude", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Bán Kính(m) 1</div>
            <Input
              type="text"
              value={displayData[0]?.radius || ""}
              onChange={(e) => updateField(0, "radius", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-4 items-center">
          <div></div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Kinh Độ 2</div>
            <Input
              type="text"
              value={displayData[1]?.longitude || ""}
              onChange={(e) => updateField(1, "longitude", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Vĩ Độ 2</div>
            <Input
              type="text"
              value={displayData[1]?.latitude || ""}
              onChange={(e) => updateField(1, "latitude", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Bán Kính(m) 2</div>
            <Input
              type="text"
              value={displayData[1]?.radius || ""}
              onChange={(e) => updateField(1, "radius", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4 gap-4 items-center">
          <div></div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Kinh Độ 3</div>
            <Input
              type="text"
              value={displayData[2]?.longitude || ""}
              onChange={(e) => updateField(2, "longitude", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Vĩ Độ 3</div>
            <Input
              type="text"
              value={displayData[2]?.latitude || ""}
              onChange={(e) => updateField(2, "latitude", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-center">Bán Kính(m) 3</div>
            <Input
              type="text"
              value={displayData[2]?.radius || ""}
              onChange={(e) => updateField(2, "radius", e.target.value)}
              disabled={!editing}
              className="text-center"
            />
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            Hủy
          </Button>
        </div>
      )}
    </div>
  );
};

export default SafeZoneEditor;

