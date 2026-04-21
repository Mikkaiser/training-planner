"use client";

import { MousePointerClick } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { useSelection } from "@/components/plan-detail/selection-context";
import { BlockDetail } from "@/components/plan-detail/block-detail";

export function DetailColumn() {
  const { detail, tokens } = usePlanDetailContext();
  const { selection } = useSelection();

  const selectedKey = selection ? `block:${selection.id}` : "empty";

  return (
    <section className="plan-detail-column glass-panel">
      <div className="plan-detail-column__scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="plan-detail-column__content"
          >
            {!selection ? (
              <div className="plan-detail-column__empty">
                <MousePointerClick
                  size={48}
                  style={{ color: tokens.accent, opacity: 0.4 }}
                />
                <p>Select a block from the roadmap</p>
              </div>
            ) : (
              <BlockDetail block={detail.blocksById.get(selection.id)!} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
