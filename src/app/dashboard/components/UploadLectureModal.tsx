"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

export const UploadLectureModal: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="font-medium" variant="default">
          Upload Lecture
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Lecture</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Button variant="secondary" className="justify-start">
            Upload Audio
          </Button>
          <Button variant="secondary" className="justify-start">
            Paste Text
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
