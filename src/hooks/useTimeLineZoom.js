import { useState, useCallback } from "react";

export const ZOOM_LEVELS = {
  EON: "eon",
  PERIOD: "period",
  EVENT: "event",
};

export function useTimeLineZoom(timelineData) {
  const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVELS.EON);
  const [activePath, setActivePath] = useState([]);
  const [targetPosition, setTargetPosition] = useState(null);

  const getVisibleItems = useCallback(() => {
    if (zoomLevel === ZOOM_LEVELS.EON) {
      return timelineData;
    }

    if (zoomLevel === ZOOM_LEVELS.PERIOD && activePath.length > 0) {
      const activeEon = timelineData.find((eon) => eon.id === activePath[0]);
      return activeEon?.children || [];
    }

    if (zoomLevel === ZOOM_LEVELS.EVENT && activePath.length > 1) {
      const activeEon = timelineData.find((eon) => eon.id === activePath[0]);
      const activePeriod = activeEon?.children.find(
        (period) => period.id === activePath[1],
      );
      return activePeriod?.children || [];
    }

    return [];
  }, [zoomLevel, activePath, timelineData]);

  const zoomIn = useCallback((item) => {
    if (item.type === "eon") {
      setZoomLevel(ZOOM_LEVELS.PERIOD);
      setActivePath([item.id]);
      setTargetPosition(item.position);
    } else if (item.type === "period") {
      setZoomLevel(ZOOM_LEVELS.EVENT);
      setActivePath((prev) => [...prev, item.id]);
      setTargetPosition(item.position);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (zoomLevel === ZOOM_LEVELS.EVENT) {
      setZoomLevel(ZOOM_LEVELS.PERIOD);
      setActivePath((prev) => prev.slice(0, -1));
      const activeEon = timelineData.find((eon) => eon.id === activePath[0]);
      setTargetPosition(activeEon?.position || 0);
    } else if (zoomLevel === ZOOM_LEVELS.PERIOD) {
      setZoomLevel(ZOOM_LEVELS.EON);
      setActivePath([]);
      setTargetPosition(null);
    }
  }, [zoomLevel, activePath, timelineData]);

  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs = [];

    if (activePath.length > 0) {
      const eon = timelineData.find((e) => e.id === activePath[0]);
      if (eon) breadcrumbs.push({ name: eon.name, level: ZOOM_LEVELS.EON });
    }

    if (activePath.length > 1) {
      const eon = timelineData.find((e) => e.id === activePath[0]);
      const period = eon?.children.find((p) => p.id === activePath[1]);
      if (period)
        breadcrumbs.push({ name: period.name, level: ZOOM_LEVELS.PERIOD });
    }

    return breadcrumbs;
  }, [activePath, timelineData]);

  return {
    zoomLevel,
    activePath,
    targetPosition,
    visibleItems: getVisibleItems(),
    breadcrumbs: getBreadcrumbs(),
    zoomIn,
    zoomOut,
    canZoomOut: zoomLevel !== ZOOM_LEVELS.EON,
  };
}
