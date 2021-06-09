/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/import { assert } from '../../../common/util/util.js';import { kAllTextureFormatInfo } from '../../capability_info.js';import { align } from '../../util/math.js';











function endOfRange(r) {
  return 'count' in r ? r.begin + r.count : r.end;
}

function* rangeAsIterator(r) {
  for (let i = r.begin; i < endOfRange(r); ++i) {
    yield i;
  }
}

export class SubresourceRange {



  constructor(subresources)


  {
    this.mipRange = {
      begin: subresources.mipRange.begin,
      end: endOfRange(subresources.mipRange) };

    this.layerRange = {
      begin: subresources.layerRange.begin,
      end: endOfRange(subresources.layerRange) };

  }

  *each() {
    for (let level = this.mipRange.begin; level < this.mipRange.end; ++level) {
      for (let layer = this.layerRange.begin; layer < this.layerRange.end; ++layer) {
        yield { level, layer };
      }
    }
  }

  *mipLevels() {
    for (let level = this.mipRange.begin; level < this.mipRange.end; ++level) {
      yield {
        level,
        layers: rangeAsIterator(this.layerRange) };

    }
  }}


// TODO(jiawei.shao@intel.com): support 1D and 3D textures
export function physicalMipSize(
size,
format,
dimension,
level)
{
  assert(dimension === '2d');
  assert(Math.max(size.width, size.height) >> level > 0);

  const virtualWidthAtLevel = Math.max(size.width >> level, 1);
  const virtualHeightAtLevel = Math.max(size.height >> level, 1);
  const physicalWidthAtLevel = align(virtualWidthAtLevel, kAllTextureFormatInfo[format].blockWidth);
  const physicalHeightAtLevel = align(
  virtualHeightAtLevel,
  kAllTextureFormatInfo[format].blockHeight);

  return {
    width: physicalWidthAtLevel,
    height: physicalHeightAtLevel,
    depthOrArrayLayers: size.depthOrArrayLayers };

}
//# sourceMappingURL=subresource.js.map