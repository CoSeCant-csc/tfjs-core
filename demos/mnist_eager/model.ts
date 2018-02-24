import * as dl from 'deeplearn';
import {MnistData} from './data';

// Hyperparameters.
const LEARNING_RATE = .05;
const BATCH_SIZE = 64;
const TRAIN_STEPS = 200;

// Data constants.
const IMAGE_SIZE = 784;
const LABELS_SIZE = 10;

const optimizer = dl.train.sgd(LEARNING_RATE);

// Set up the model and loss function.
const weights: dl.Tensor2D = dl.variable(
    dl.randomNormal([IMAGE_SIZE, LABELS_SIZE], 0, 1 / Math.sqrt(IMAGE_SIZE)));

const model = (xs: dl.Tensor2D) => xs.matMul(weights);

const loss = (labels: dl.Tensor2D, ys: dl.Tensor2D) =>
    dl.losses.softmaxCrossEntropy(labels, ys).mean() as dl.Scalar;

// Train the model.
export async function train(data: MnistData) {
  let cost: dl.Scalar;
  // Warm up.
  cost = optimizer.minimize(() => {
    const batch = data.nextTrainBatch(BATCH_SIZE);
    return loss(batch.labels, model(batch.xs));
  }, true);
  await cost.data();
  const start = performance.now();
  for (let i = 0; i < TRAIN_STEPS; i++) {
    cost = optimizer.minimize(() => {
      const batch = data.nextTrainBatch(BATCH_SIZE);

      return loss(batch.labels, model(batch.xs));
    }, i === TRAIN_STEPS - 1);
  }
  const costVal = (await cost.data())[0];
  console.log('Train took', performance.now() - start, 'ms');
  console.log('cost', costVal);
}

// Predict the digit number from a batch of input images.
export function predict(x: dl.Tensor2D): number[] {
  const pred = dl.tidy(() => {
    const axis = 1;
    return model(x).argMax(axis);
  });
  return Array.from(pred.dataSync());
}

// Given a logits or label vector, return the class indices.
export function classesFromLabel(y: dl.Tensor2D): number[] {
  const axis = 1;
  const pred = y.argMax(axis);

  return Array.from(pred.dataSync());
}
