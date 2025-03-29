import { data } from '@/components/data';  
import { NetworkDiagram } from '@/components/Network';

export const NetworkDiagramBasicCanvasDemo = ({
  width = 700,
  height = 400,
}) => {
  if (width === 0) {
    return null;
  }
  return <NetworkDiagram data={data} width={width} height={height} />;
};
