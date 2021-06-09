import { assert } from '../../../../../common/framework/util/util.js';
import {
  EncodableTextureFormat,
  kEncodableTextureFormatInfo,
} from '../../../../capability_info.js';
import { getMipSizePassthroughLayers } from '../../../../util/texture/layout.js';
import { CheckContents } from '../texture_zero.spec.js';

export const checkContentsByBufferCopy: CheckContents = (
  t,
  params,
  texture,
  state,
  subresourceRange
) => {
  for (const { level: mipLevel, layer } of subresourceRange.each()) {
    assert(params.dimension !== '1d');
    assert(params.format in kEncodableTextureFormatInfo);
    const format = params.format as EncodableTextureFormat;

    t.expectSingleColor(texture, format, {
      size: [t.textureWidth, t.textureHeight, t.textureDepth],
      dimension: params.dimension,
      slice: layer,
      layout: { mipLevel },
      exp: t.stateToTexelComponents[state],
    });
  }
};

export const checkContentsByTextureCopy: CheckContents = (
  t,
  params,
  texture,
  state,
  subresourceRange
) => {
  for (const { level, layer } of subresourceRange.each()) {
    assert(params.dimension !== '1d');
    assert(params.format in kEncodableTextureFormatInfo);
    const format = params.format as EncodableTextureFormat;

    const [width, height, depth] = getMipSizePassthroughLayers(
      params.dimension,
      [t.textureWidth, t.textureHeight, t.textureDepth],
      level
    );

    const dst = t.device.createTexture({
      dimension: params.dimension,
      size: [width, height, depth],
      format: params.format,
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
    });

    const commandEncoder = t.device.createCommandEncoder();
    commandEncoder.copyTextureToTexture(
      { texture, mipLevel: level, origin: { x: 0, y: 0, z: layer } },
      { texture: dst, mipLevel: 0 },
      { width, height, depthOrArrayLayers: depth }
    );
    t.queue.submit([commandEncoder.finish()]);

    t.expectSingleColor(dst, format, {
      size: [width, height, depth],
      exp: t.stateToTexelComponents[state],
    });
  }
};
